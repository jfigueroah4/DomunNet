import os
import re

mig_dir = 'C:/DomunNet/backend/supabase/migrations'
for f_name in os.listdir(mig_dir):
    if f_name.endswith('.sql'):
        with open(os.path.join(mig_dir, f_name), 'r', encoding='utf-8') as f:
            text = f.read()
            for match in re.finditer(r'CREATE TABLE [\s\S]*?\);', text):
                table_def = match.group(0)
                if 'proyecto' in table_def.lower():
                    print(f"--- From {f_name} ---")
                    print(table_def)
