const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY || process.env.VITE_API_KEY;

if (!apiKey) {
    console.error("No API Key found in .env.local");
    process.exit(1);
}

console.log(`Querying API with Key: ${apiKey.substring(0, 10)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error Response:", JSON.stringify(json.error, null, 2));
            } else {
                console.log("\n✅ SUCCESS! Found the following models:\n");
                if (json.models) {
                    json.models.forEach(m => {
                        // Filter for 'generateContent' support
                        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                            console.log(` - ${m.name}`);
                        }
                    });
                } else {
                    console.log("No models array found in response. Raw:", json);
                }
            }
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Response Data:", data);
        }
    });
}).on('error', (e) => {
    console.error("Network Request Error:", e);
});
