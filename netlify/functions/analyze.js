exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { image, prompt } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: "APIキーが設定されていません。" }) };
        }

        /**
         * 使用するモデルを選択してください：
         * 1. "gemini-3-flash" (1K RPM / 10K RPD)
         * 2. "gemini-2.0-flash" (2K RPM / 無制限 RPD)
         */
        const MODEL = "gemini-3-flash"; 
        
        // プレビューや最新モデルは v1beta エンドポイントが最も確実です
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        console.log(`Executing request with Model: ${MODEL}`);

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
            console.error("Gemini Error:", data.error.message);
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: `[${MODEL}] ${data.error.message}` }) 
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
