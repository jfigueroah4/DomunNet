const fs = require('fs');
const path = 'C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx';
let content = fs.readFileSync(path, 'utf-8');
const map = {
  'CrÃ­ticas': 'Críticas',
  'CatÃ¡logos': 'Catálogos',
  'ConfiguraciÃ³n': 'Configuración',
  'RenglÃ³n': 'Renglón',
  'CapÃ­tulos': 'Capítulos',
  'SÃ¡bana': 'Sábana',
  'BitÃ¡cora': 'Bitácora',
  'BitÃ¡coras': 'Bitácoras',
  'FotogrÃ¡ficas': 'Fotográficas',
  'TÃ©cnicas': 'Técnicas',
  'CategorÃ­as': 'Categorías',
  'ParÃ¡metros': 'Parámetros',
  'AuditorÃ­a': 'Auditoría',
  'AuditorÃ­as': 'Auditorías',
  'KilomÃ©tricas': 'Kilométricas',
  'ClimÃ¡ticas': 'Climáticas',
  'GestiÃ³n': 'Gestión',
  'BÃºsqueda': 'Búsqueda',
  'SÃ­': 'Sí',
  'SÃ ': 'SÍ',
  'pÃ¡gina': 'página',
  'PÃ¡gina': 'Página',
  'Â¿EstÃ¡': '¿Está'
};
for (const [bad, good] of Object.entries(map)) {
  content = content.split(bad).join(good);
}
fs.writeFileSync(path, content, 'utf-8');
console.log('Fixed encoding!');
