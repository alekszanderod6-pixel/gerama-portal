# Fix corrupted emoji in help button
import re

with open('js/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the corrupted helpBtn.innerHTML line
content = re.sub(r"helpBtn\.innerHTML = '[^']*';", "helpBtn.innerHTML = '❓';", content)

with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed help button emoji")
