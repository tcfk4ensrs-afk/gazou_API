exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { image, prompt } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "Netlifyの環境変数にAPIキーが設定されていません。" }) 
            };
        }

        // 画像のバージョン（Gemini 3 Flash）に合わせてモデル名を変更
        const MODEL = "gemini-3-flash"; 
        
        // 最新モデルを使用するため、エンドポイントを確認（必要に応じて v1beta に変更）
        const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

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
                    maxOutputTokens: 100
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error Detail:", data.error);
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: `Google APIエラー: ${data.error.message}` }) 
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Internal Server Error:", error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "サーバー側で予期せぬエラーが発生しました。" }) 
        };
    }
};
