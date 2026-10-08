// Build script to generate env-config.js from Vercel environment variables
// Run this during Vercel build: node build-env-config.js

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ykffelsvpopmpeagyhse.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZmZlbHN2cG9wbXBlYWd5aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjE0NTgsImV4cCI6MjEwNzAzNzQ1OH0.zAtMslRU12VFDD93p8oJCao-HoAnDdCaQD3UFFNuwo8';
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
