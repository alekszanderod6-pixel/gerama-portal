# Fix corrupted Ghanaian Cedi currency symbol - more aggressive fix
import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original = content
    
    # Replace corrupted currency symbol patterns more aggressively
    # Fix GH₵ followed by spaces and then digits
    content = re.sub(r"GH₵\s+", "GH₵ ", content)
    
    # Fix any remaining corrupted sequences around GH₵
    content = re.sub(r"GH₵[^\d\s]", "GH₵", content)
    
    # Fix double spaces after currency symbol
    content = re.sub(r"GH₵  +", "GH₵ ", content)
    
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
