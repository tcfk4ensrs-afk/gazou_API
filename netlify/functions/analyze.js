// netlify/functions/analyze.js

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { target, image } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            console.error("API_KEY is not defined in environment variables.");
            return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
        }

        // Gemini API へのリクエスト
        // プロパティ名は inline_data ではなく inlineData (キャメルケース) です
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `Is the brand or facility "${target}" clearly visible in this image? Answer ONLY with "YES" or "NO".` },
                        {
                            inlineData: {  // ← ここを修正 (inline_data から inlineData へ)
                                mimeType: "image/jpeg", // ← ここも念のためキャメルケースに修正
                                data: image
                            }
                        }
                    ]
                }]
            })
        });

        const data = await response.json();

        // Google側でエラーが発生している場合、ログに出力して原因を特定しやすくする
        if (data.error) {
            console.error("Gemini API Error Details:", JSON.stringify(data.error, null, 2));
            return {
                statusCode: 500,
                body: JSON.stringify({ error: data.error.message })
            };
        }
        
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "NO";

        return {
            statusCode: 200,
            body: JSON.stringify({ result: resultText.trim() })
        };
    } catch (error) {
        console.error("Internal Server Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to analyze image" })
        };
    }
};
