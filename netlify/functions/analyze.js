exports.handler = async (event, context) => {
    // POST以外をブロック
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
         * モデル名の選択について：
         * 安定性を求めるなら: gemini-1.5-flash
         * 最新の実験版を試すなら: gemini-2.0-flash-exp
         */
        const MODEL_NAME = "gemini-1.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

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
                // 判定を確実にするための設定（任意）
                generationConfig: {
                    temperature: 0.1, // 低めに設定することで回答を安定させる
                    topP: 0.95,
                    maxOutputTokens: 100,
                }
            })
        });

        const data = await response.json();

        // Geminiからのエラーレスポンスをチェック
        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: `Gemini API Error: ${data.error.message}` }) 
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Function Crash:", error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "サーバー内部でエラーが発生しました。" }) 
        };
    }
};
