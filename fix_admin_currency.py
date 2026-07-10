# Fix corrupted Ghanaian Cedi currency symbol in admin dashboard
import re

with open('admin-dashboard.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

original = content

# Fix the label text with extra space after currency symbol
content = re.sub(r'Price \(GH₵ \)', 'Price (GH₵)', content)
content = re.sub(r'Original Price \(GH₵ \)', 'Original Price (GH₵)', content)

if content != original:
    with open('admin-dashboard.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed admin-dashboard.html")
else:
    print("No changes needed")
