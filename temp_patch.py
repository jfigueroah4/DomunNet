import re

with open('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the block starting with <div className="relative group/filters"> and ending at </button> (2 of them? no, it has group-hover/filters:block and loops).
# I'll just use regex to replace everything inside <div className="relative group/filters"> ... </div> (the outer div).
match = re.search(r'<div className="relative group/filters">([\s\S]*?)</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*\)', content)
if match:
    # Actually wait, the HTML structure is:
    # </div>
    # </div>
    # </div>
    # </div>
    # )
    # Let's match until                  </div>\n                </div>\n              </div>\n            </div>\n          </div>\n        )
    pass
