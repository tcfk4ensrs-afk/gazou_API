// netlify/functions/analyze.js

exports.handler = async (event) => {
    // POSTメソッド以外は拒否
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { target, image } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        // node-fetch を使わず、標準の fetch を使用
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `Is "${target}" in this image? Please answer ONLY with "YES" or "NO".` },
                        { inline_data: { mime_type: "image/jpeg", data: image } }
                    ]
                }]
            })
        });

        const data = await response.json();
        
        // Geminiからのレスポンス構造を念のため確認して取得
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "NO";

        return {
            statusCode: 200,
            body: JSON.stringify({ result: resultText })
        };
    } catch (error) {
        console.error("Analysis error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to analyze image" })
        };
    }
};
