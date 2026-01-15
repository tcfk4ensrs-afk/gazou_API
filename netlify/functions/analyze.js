exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { image, prompt, apiKey } = JSON.parse(event.body);
        
        // 画面からのキーを最優先、なければ環境変数
        const FINAL_KEY = apiKey || process.env.GEMINI_API_KEY;

        if (!FINAL_KEY) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: "APIキーが入力されていません。" }) 
            };
        }

        const MODEL = "gemini-2.0-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${FINAL_KEY}`;

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
                generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
            })
        });

        const data = await response.json();

        if (data.error) {
            return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: "サーバーエラー: " + e.message }) };
    }
};
