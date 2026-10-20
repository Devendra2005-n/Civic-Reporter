
with open("backend/routes/ai.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.strip() == "// Extract JSON block":
        skip = True
    
    if skip and line.strip() == "return res.json({ raw: cleaned, error: \"JSON Parse Error: \" + err.message });":
        skip = False
        continue
        
    if skip and line.strip() == "}":
        if i > 0 and "return res.json" in lines[i-1]:
            skip = False
            continue

    if not skip:
        new_lines.append(line)

with open("backend/routes/ai.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Removed JSON parsing block")

