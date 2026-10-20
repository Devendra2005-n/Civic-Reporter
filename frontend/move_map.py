import re

with open('src/pages/Dashboard.jsx', 'r') as f:
    content = f.read()

# Find the start of the grid
grid_start = content.find('<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">')

# Extract Enhanced Map block
map_start_str = '{/* Enhanced Map */}'
map_end_str = '</div>\n\n        {/* Complaint Cards Grid */}'

map_start_idx = content.find(map_start_str)
# To find the exact end of the motion.div of the map...
# The map motion div ends right before </div> that closes lg:col-span-1
# Let's just use regex to extract it
import textwrap

map_block_pattern = re.compile(r'(\s*\{\/\* Enhanced Map \*\/\}.*?)(?=\s*<\/div>\s*\{\/\* Complaint Cards Grid \*\/\})', re.DOTALL)
match = map_block_pattern.search(content)

if match:
    map_code = match.group(1)
    
    # Remove the map code from its original position
    content = content.replace(map_code, '')
    
    # Update the map height to be taller since it's full width now
    map_code_updated = map_code.replace('className="h-80', 'className="h-[400px] lg:h-[500px]')
    
    # Add a wrapper with margin bottom
    map_code_final = f'\n        <div className="mb-8">{map_code_updated}</div>\n'
    
    # Insert before the grid
    content = content.replace('<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">', map_code_final + '        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">')
    
    with open('src/pages/Dashboard.jsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Map block not found")
