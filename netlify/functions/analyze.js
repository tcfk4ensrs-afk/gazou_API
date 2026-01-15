exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // apiKeyをリクエストボディから取り出す
        const { image, prompt, apiKey } = JSON.parse(event.body);
        
        // 1. 画面から送られてきたキーを最優先
        // 2. なければサーバーの環境変数を使用
        const FINAL_API_KEY = apiKey || process.env.GEMINI_API_KEY;

        if (!FINAL_API_KEY) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: "APIキーがありません。画面に入力するか、環境変数を設定してください。" }) 
            };
        }

        const MODEL = "gemini-2.0-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${FINAL_API_KEY}`;

        // ログでどちらのキーを使っているか確認可能（デバッグ用）
        console.log(`Using API Key from: ${apiKey ? 'Client Input' : 'Environment'}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: image } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 150
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: `[Gemini Error] ${data.error.message}` }) 
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: `通信エラー: ${error.message}` }) };
    }
};
