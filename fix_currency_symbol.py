# Fix corrupted Ghanaian Cedi currency symbol
import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original = content
    
    # Replace corrupted currency symbol patterns
    # Pattern: GH₵ followed by corrupted characters
    content = re.sub(r'GH₵[^\d\s.,]', 'GH₵', content)
    content = re.sub(r'GH₵\s*[^\d\s.,]', 'GH₵ ', content)
    
    # Also fix any standalone corrupted sequences
    content = re.sub(r'GH₵', 'GH₵', content)
    
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
