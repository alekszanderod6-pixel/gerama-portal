import os
import glob

# Common mojibake patterns and their correct replacements
replacements = {
    'â"€â"€': '——',
    'âš ï¸': '⚠️',
    'âœ…': '✅',
    'â': '—',
    '€': '—',
    '™': '™',
    '¨': '¨',
    '¡': '¡',
    '¢': '¢',
    '£': '£',
    '¤': '¤',
    '¥': '¥',
    '¦': '¦',
    '§': '§',
    '¨': '¨',
    '©': '©',
    'ª': 'ª',
    '«': '«',
    '¬': '¬',
    '®': '®',
    '¯': '¯',
    '°': '°',
    '±': '±',
    '²': '²',
    '³': '³',
    '´': '´',
    'µ': 'µ',
    '¶': '¶',
    '·': '·',
    '¸': '¸',
    '¹': '¹',
    'º': 'º',
    '»': '»',
    '¼': '¼',
    '½': '½',
    '¾': '¾',
    '¿': '¿',
}

# Find all HTML, JS, and CSS files
files = []
for ext in ['*.html', '*.js', '*.css']:
    files.extend(glob.glob(r'c:\Users\aleks\Desktop\WebDev_1\gerama\**\*' + ext, recursive=True))

fixed_count = 0
for filepath in files:
    try:
        # Read with latin-1 to see actual bytes
        with open(filepath, 'r', encoding='latin-1') as f:
            content = f.read()
        
        # Apply replacements
        original_content = content
        for mojibake, correct in replacements.items():
            content = content.replace(mojibake, correct)
        
        # Only write if changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
            fixed_count += 1
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print(f"\nTotal files fixed: {fixed_count}")
