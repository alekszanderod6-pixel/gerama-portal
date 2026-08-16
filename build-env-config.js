// Build script to generate env-config.js from Vercel environment variables
// Run this during Vercel build: node build-env-config.js

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://obfhmyeghurqfxingwtu.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZmhteWVnaHVycWZ4aW5nd3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTIxODMsImV4cCI6MjEwMTM2ODE4M30.mAgIHzhodRXTya-BfhA_ZLD2eoeshle79Zx6isKbXj4';
const geramaCode = process.env.GERAMA_CODE || 'GERAMA2026';
const onesignalRestKey = process.env.ONESIGNAL_REST_KEY || '';

const configContent = `// Environment Configuration for GERAMA Portal
// This file is auto-generated during build from Vercel environment variables
// DO NOT EDIT MANUALLY

window.__SUPABASE_URL = '${supabaseUrl}';
window.__SUPABASE_KEY = '${supabaseKey}';
window.__GERAMA_CODE = '${geramaCode}';
window.__ONESIGNAL_REST_KEY = '${onesignalRestKey}';

console.log('[GERAMA] Environment config loaded from Vercel env vars');
`;

const outputPath = path.join(__dirname, 'js', 'env-config.js');
fs.writeFileSync(outputPath, configContent, 'utf8');
console.log('– env-config.js generated successfully');
