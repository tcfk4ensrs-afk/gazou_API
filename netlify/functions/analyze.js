exports.handler = async (event, context) => {
    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // --- 診断モード：まずは使えるモデルをログに出力する ---
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();
        
        // Netlifyのログに「今使えるモデル名」をすべて書き出す
        console.log("--- Available Models ---");
        if (listData.models) {
            listData.models.forEach(m => console.log(m.name));
        }

        // --- 本題の解析処理 ---
        const { image, prompt } = JSON.parse(event.body);
        
        // ユーザー様が言及された「3」や最新の「2.0」など、複数の候補を順に試す
        // ここでは一番確実な v1beta を再度使用します
        const MODEL = "gemini-1.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: image } }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // エラーが出た場合、メッセージに「使えるモデル」のヒントを混ぜて返す
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: `[v1beta] ${data.error.message}. お使いのキーで使えるモデルを確認してください。` }) 
            };
        }

        return { statusCode: 200, body: JSON.stringify(data) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
