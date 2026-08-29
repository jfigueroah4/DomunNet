import re

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

# Print ALL ALTER TABLE ... FOREIGN KEY lines
print("=== ALL ALTER TABLE FOREIGN KEY statements ===")
count = 0
for line in sql.split('\n'):
    if 'FOREIGN KEY' in line.upper() and 'ALTER' in line.upper():
        print(line.strip())
        count += 1

print(f"\nTotal ALTER TABLE FK statements: {count}")

# Also check for inline REFERENCES in CREATE TABLE
print("\n=== INLINE REFERENCES in CREATE TABLE ===")
current_table = None
inline_count = 0
for line in sql.split('\n'):
    stripped = line.strip()
    match_table = re.match(r'CREATE TABLE (\w+) \(', stripped)
    if match_table:
        current_table = match_table.group(1)
        continue
    if current_table and stripped.startswith(');'):
        current_table = None
        continue
    if current_table and 'REFERENCES' in stripped.upper():
        ref_match = re.search(r'(\w+)\s+UUID.*?REFERENCES\s+(\w+)', stripped, re.IGNORECASE)
        if ref_match:
            col = ref_match.group(1)
            parent = ref_match.group(2)
            print(f"  {current_table}.{col} -> {parent}")
            inline_count += 1
        else:
            # Try broader match
            ref_match2 = re.search(r'(\w+)\s+\w+.*?REFERENCES\s+(\w+)', stripped, re.IGNORECASE)
            if ref_match2:
                col = ref_match2.group(1)
                parent = ref_match2.group(2)
                print(f"  {current_table}.{col} -> {parent}")
                inline_count += 1
            else:
                print(f"  {current_table}: UNPARSED: {stripped[:100]}")

print(f"\nTotal inline FK: {inline_count}")
