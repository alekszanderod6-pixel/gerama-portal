import os, re

files = [
    "index.html","about.html","admin-dashboard.html","dashboard.html",
    "login.html","connect.html","contact.html","help.html",
    "classroom.html","mall.html","js/main.js","js/gerama-features.js",
    "js/admin-dashboard.js","css/style.css"
]

mojibake_re = re.compile(r'[^\x00-\x7F]')

for fname in files:
    if not os.path.exists(fname):
        print("MISSING: " + fname)
        continue
    with open(fname, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()
    hits = []
    for i, line in enumerate(lines, 1):
        non_ascii = mojibake_re.findall(line)
        if non_ascii:
            chars_info = list(set([(c, hex(ord(c))) for c in non_ascii]))
            hits.append((i, line.rstrip()[:120], chars_info))
    if hits:
        print("\n=== " + fname + " (" + str(len(hits)) + " lines with non-ASCII) ===")
        for ln, text, chars in hits[:25]:
            print("  L" + str(ln) + ": " + text)
            suspicious = [(c, h) for c, h in chars if ord(c) < 0x2000 or (0xD000 <= ord(c) <= 0xFFFF)]
            if suspicious:
                print("       CHARS: " + str(suspicious))
    else:
        print(fname + ": CLEAN")
