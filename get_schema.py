import re

with open('C:/DomunNet/backend/supabase/migrations/20260708_001_esquema_inicial.sql', 'r', encoding='utf-8') as f:
    text = f.read()

for match in re.finditer(r'CREATE TABLE [\s\S]*?\);', text):
    table_def = match.group(0)
    if 'proyecto' in table_def.lower():
        print(table_def)
        print('-'*40)
