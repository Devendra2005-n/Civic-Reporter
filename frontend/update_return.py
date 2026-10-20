import re

with open('src/components/AIChatbot.jsx', 'r') as f:
    content = f.read()

content = content.replace('if (isAdmin) return null;', 'if (isAdmin || hideOnPaths.includes(location.pathname)) return null;')

with open('src/components/AIChatbot.jsx', 'w') as f:
    f.write(content)
print("Updated")
