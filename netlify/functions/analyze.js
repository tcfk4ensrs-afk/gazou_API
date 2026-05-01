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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `この画像の中に「${target}」という店舗やロゴ、施設がはっきりと写っているか判定してください。
                                
                                返答は必ず以下の形式（JSON）で返してください。
                                {
                                  "result": "YES" または "NO",
                                  "analysis": "判定理由を日本語で1文程度。何が見えるか、なぜ失敗したかを具体的に書いてください"
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
                // JSON形式で返答を強制するための設定
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error Details:", JSON.stringify(data.error, null, 2));
            return {
                statusCode: 500,
                body: JSON.stringify({ error: data.error.message })
            };
        }
        
        // GeminiからのJSON回答をパースする
        const resultJsonString = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"result":"NO","analysis":"AIが応答しませんでした。"}';
        const parsedResult = JSON.parse(resultJsonString);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                result: parsedResult.result, 
                analysis: parsedResult.analysis 
            })
        };

    } catch (error) {
        console.error("Internal Server Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to analyze image", analysis: "サーバー内でエラーが発生しました。" })
        };
    }
};
