exports.handler = async (event, context) => {
    // ログに実行バージョンを出力（デバッグ用）
    console.log("--- Executing analyze.js [Version 1.0 Stable] ---");

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { image, prompt } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: "APIキーが設定されていません。" }) };
        }

        // 修正：v1betaではなく「v1」を使い、モデル名を正確に指定
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: image } }
                    ]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            // エラー文にバージョン情報を付与して返す
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: `[v1] ${data.error.message}` }) 
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "通信に失敗しました。" }) };
    }
};
