// Build script to generate env-config.js from Vercel environment variables
// Run this during Vercel build: node build-env-config.js

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://hdrnnvvrtbwjsxtrxzfj.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkcm5udnZydGJ3anN4dHJ4emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3MTgsImV4cCI6MjA5MjEwMDcxOH0.rEHkz3HOoXArRkasGSaxK6JQZrQHI2LAJ7c6Dj8DaQI';
const geramaCode = process.env.GERAMA_CODE || 'GERAMA2026';

const configContent = `// Environment Configuration for GERAMA Portal
// This file is auto-generated during build from Vercel environment variables
// DO NOT EDIT MANUALLY

window.__SUPABASE_URL = '${supabaseUrl}';
window.__SUPABASE_KEY = '${supabaseKey}';
window.__GERAMA_CODE = '${geramaCode}';

console.log('[GERAMA] Environment config loaded from Vercel env vars');
`;

const outputPath = path.join(__dirname, 'js', 'env-config.js');
fs.writeFileSync(outputPath, configContent, 'utf8');
console.log('✅ env-config.js generated successfully');
