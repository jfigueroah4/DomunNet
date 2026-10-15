const fs = require('fs');
const p = 'C:/DomunNet/frontend/src/components/layout/AIAssistant.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.split('bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300').join('bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300');
const s = c.indexOf('    // Respuesta local de respaldo');
const e = c.indexOf('      setMessages((prev) => [', s);
const repl = [
  '    // Respuesta local de respaldo si la red falla',
  '    setTimeout(() => {',
  "      const greeting = primerNombre ? `Hola, ${primerNombre}. ` : '';",
  '      const replyContent = `${greeting}No fue posible consultar el asistente en este momento. Intenta de nuevo en unos segundos.`;',
  '',
  ''
].join('\n');
c = c.slice(0, s) + repl + c.slice(e);
fs.writeFileSync(p, c);
console.log('ok');
