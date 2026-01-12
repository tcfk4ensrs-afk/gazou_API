// 標準のfetchを使用（require('node-fetch')は不要です）
exports.handler = async (event, context) => {
    console.log("--- Function Started ---"); // ログ開始

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { image, prompt } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            console.error("Error: GEMINI_API_KEY is not set in Netlify!");
            return { statusCode: 500, body: JSON.stringify({ error: "API Key missing" }) };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        console.log("Sending request to Gemini...");
        
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
        
        // Geminiからのエラーがある場合
        if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };
        }

        console.log("Gemini Success!");
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Function Crash Error:", error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};
