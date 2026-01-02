
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read .env manually since we don't have dotenv
const envPath = path.join(rootDir, '.env');
let apiKey = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
    if (match) {
        apiKey = match[1].trim().replace(/^['"]|['"]$/g, '');
    }
}

if (!apiKey) {
    console.error('Error: VITE_GEMINI_API_KEY not found in .env');
    process.exit(1);
}

console.log(`Using API Key: ${apiKey.substring(0, 5)}...`);

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error('API Error:', JSON.stringify(data, null, 2));
            return;
        }

        console.log('Available Models:');
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log('No models found in response:', data);
        }

    } catch (error) {
        console.error('Request Failed:', error);
    }
}

listModels();
