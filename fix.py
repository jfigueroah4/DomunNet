import re

with open(r'C:\DomunNet\frontend\src\app\(dashboard)\perfil\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the changes
content = content.replace("import { toast } from 'sonner'", "import { toast } from 'sonner'\nimport { useAuthStore } from '@/stores/useAuthStore'")

# Remove UserProfile interface
content = re.sub(r'interface UserProfile \{[^\}]+\}', '', content)

# Apply hooks
content = content.replace('const [profile, setProfile] = useState<UserProfile | null>(null)', 'const { profile, loading, fetchProfile } = useAuthStore()')
content = content.replace('const [loading, setLoading] = useState(true)', '')

# Remove fetchProfile implementation
content = re.sub(r'const fetchProfile = async \(\) => \{[^\}]+\} catch \(err\) \{[^\}]+\} finally \{[^\}]+\}\s*\}', '', content)

# Change useEffect
content = content.replace('useEffect(() => {\n    fetchProfile()\n  }, [])', 'useEffect(() => {\n    fetchProfile()\n  }, [fetchProfile])')

with open(r'C:\DomunNet\frontend\src\app\(dashboard)\perfil\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

