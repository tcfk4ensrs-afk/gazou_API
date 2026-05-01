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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `この画像に何が写っているか15文字程度で説明し、その後に続けて、対象物「${target}」が写っていると判断できるなら "YES"、そうでないなら "NO" と出力してください。
                                
                                返答は必ず以下のJSON形式で返してください。
                                {
                                  "analysis": "[画像の説明文をここに書く]",
                                  "result": "[YES または NO]"
                                }` 
                        },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
        }
        
        // AIの返答をパース
        const resultJsonString = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"result":"NO","analysis":"AIが応答しませんでした。"}';
        const parsedResult = JSON.parse(resultJsonString);

        // ★ ここがポイント：AIがNOと言っても、説明文(analysis)の中に店名(target)があれば救済してYESにする
        let finalResult = parsedResult.result.toUpperCase();
        if (finalResult === "NO" && parsedResult.analysis.includes(target)) {
            finalResult = "YES";
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                result: finalResult, 
                analysis: parsedResult.analysis 
            })
        };

    } catch (error) {
        console.error("Internal Server Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to analyze", analysis: "エラーが発生しました。" })
        };
    }
};
