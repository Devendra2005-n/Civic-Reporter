import re

with open('src/pages/Dashboard.jsx', 'r') as f:
    content = f.read()

# Extract map block
map_block_pattern = re.compile(r'(\s*<div className="mb-8">\s*\{\/\* Enhanced Map \*\/\}.*?<\/div>\s*)(?=<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">)', re.DOTALL)
match = map_block_pattern.search(content)

if match:
    map_code = match.group(1)
    
    # Remove it
    content = content.replace(map_code, '\n        ')
    
    map_code_updated = map_code.replace('className="mb-8"', 'className="mt-12"')
    
    end_pattern = '      </div>\n    </div>\n  );\n};\n\nexport default Dashboard;'
    
    if end_pattern in content:
        new_end = '      </div>\n' + map_code_updated + '\n    </div>\n  );\n};\n\nexport default Dashboard;'
        content = content.replace(end_pattern, new_end)
        with open('src/pages/Dashboard.jsx', 'w') as f:
            f.write(content)
        print("Success")
    else:
        print("End pattern not found.")
else:
    print("Map block not found")
