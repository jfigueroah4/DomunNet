import os
import glob

def fix_encoding(directory):
    replacements = {
        'Ã¡': 'á',
        'Ã©': 'é',
        'Ã­': 'í',
        'Ã³': 'ó',
        'Ãº': 'ú',
        'Ã±': 'ñ',
        'Ã ': 'Á',
        'Ã‰': 'É',
        'Ã\x8d': 'Í',
        'Ã“': 'Ó',
        'Ãš': 'Ú',
        'Ã‘': 'Ñ',
        'ǭ': 'á',
        'Gestin': 'Gestión'
    }

    files = glob.glob(os.path.join(directory, '**/*.ts*'), recursive=True)
    count = 0
    for file in files:
        if 'node_modules' in file or '.next' in file: continue
        
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for bad, good in replacements.items():
                new_content = new_content.replace(bad, good)
            
            if new_content != content:
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {file}")
                count += 1
        except Exception as e:
            pass
    print(f"Total files fixed: {count}")

fix_encoding(r'C:\DomunNet\frontend\src')
