import sys

path = r"C:\DomunNet\frontend\src\stores\useAuthStore.ts"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "set({ error: err, loading: false })",
    "set({ profile: null, error: err, loading: false })"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
