import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the backend URL from environment variables.
const backendUrl = process.env.VITE_API_URL || 'https://docio-platform.onrender.com';
const cleanBackendUrl = backendUrl.trim().replace(/\/$/, '');

const config = {
  rewrites: [
    { "source": "/api/:path*", "destination": `${cleanBackendUrl}/api/:path*` },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
};

fs.writeFileSync(
  path.join(__dirname, 'vercel.json'),
  JSON.stringify(config, null, 2)
);

console.log(`Generated client/vercel.json pointing to backend: ${cleanBackendUrl}`);
