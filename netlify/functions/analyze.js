// netlify/functions/analyze.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    // POSTメソッド以外は拒否
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { target, image } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY; // Netlifyの設定画面で登録する変数

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `Is "${target}" in this image? Please answer ONLY with "YES" or "NO".` },
                        { inline_data: { mime_type: "image/jpeg", data: image } }
                    ]
                }]
            })
        });

        const data = await response.json();
        const resultText = data.candidates[0].parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ result: resultText })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to analyze image" })
        };
    }
};
