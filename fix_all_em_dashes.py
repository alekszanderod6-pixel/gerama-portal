# Fix all remaining em dash encoding issues across all files
import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original = content
    
    # Replace corrupted em dash sequences with proper en dash or em dash
    # Pattern for corrupted comment separators
    content = re.sub(r'—{20,}', '—', content)  # Collapse long sequences
    
    # Replace corrupted em dashes in comments with proper em dash
    content = re.sub(r'—��', '–', content)  # Corrupted em dash to en dash
    content = re.sub(r'—', '–', content)  # Single corrupted to en dash
    
    # Fix specific comment patterns
    content = re.sub(r'// —{2,} ([A-Z ]+) —{2,}', r'// ============================================\n// \1\n// ============================================', content)
    content = re.sub(r'// —{2,}', r'// ===========================================', content)
    
    # Fix corrupted em dashes in text content
    content = re.sub(r'— ', '– ', content)  # Em dash followed by space to en dash
    content = re.sub(r' —', ' –', content)  # Space followed by em dash to en dash
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
        return True
    return False

# Fix all JS and HTML files
extensions = ['.js', '.html', '.css']
fixed_count = 0

for root, dirs, files in os.walk('.'):
    for file in files:
        if any(file.endswith(ext) for ext in extensions):
            filepath = os.path.join(root, file)
            if fix_file(filepath):
                fixed_count += 1

print(f"\nTotal files fixed: {fixed_count}")
