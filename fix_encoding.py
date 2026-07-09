#!/usr/bin/env python3
import os
import re
from pathlib import Path

# Main encoding fixes
ENCODING_FIXES = {
    '—': '—',  # em dash
    '–': '–',  # en dash  
    'GH—': 'GH₵',  # Ghana Cedi
    'â€”': '—',
    'â€“': '–',
    'â€™': "'",
    'â€˜': "'",
    'â€œ': '"',
    'â€': '"',
    'Â': '',
}

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original = content
    for bad, good in ENCODING_FIXES.items():
        content = content.replace(bad, good)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Process all HTML, JS, CSS files
extensions = ['.html', '.js', '.css']
fixed_count = 0

for ext in extensions:
    for filepath in Path('.').rglob(f'*{ext}'):
        if fix_file(filepath):
            print(f'Fixed: {filepath}')
            fixed_count += 1

print(f'\nTotal files fixed: {fixed_count}')
