import os
mig_dir = 'C:/DomunNet/backend/supabase/migrations'
for f_name in os.listdir(mig_dir):
    if f_name.endswith('.sql'):
        with open(os.path.join(mig_dir, f_name), 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                if 'table' in line.lower() and 'proyecto' in line.lower():
                    print(f"--- From {f_name} ---")
                    start = max(0, i-2)
                    end = min(len(lines), i+15)
                    print(''.join(lines[start:end]))
