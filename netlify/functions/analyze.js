exports.handler = async (event, context) => {
    // POST以外は受け付けない
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { image, prompt, apiKey } = JSON.parse(event.body);
        
        // 画面からのキーを優先し、なければサーバーの環境変数を使う
        const FINAL_API_KEY = apiKey || process.env.GEMINI_API_KEY;

        if (!FINAL_API_KEY) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: "APIキーがありません。画面に入力してください。" }) 
            };
        }

        const MODEL = "gemini-2.0-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${FINAL_API_KEY}`;

        console.log(`Analyzing with model: ${MODEL}`);

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
                    maxOutputTokens: 10
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: `[AI Error] ${data.error.message}` }) 
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: `Server Error: ${error.message}` }) };
    }
};
