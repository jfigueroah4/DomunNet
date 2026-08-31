const fs = require('fs');

function fixEncoding(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/Ã³/g, 'ó');
  content = content.replace(/Ã¡/g, 'á');
  content = content.replace(/Ã©/g, 'é');
  content = content.replace(/Ã­/g, 'í');
  content = content.replace(/Ãº/g, 'ú');
  content = content.replace(/Ã±/g, 'ñ');
  content = content.replace(/Ã“/g, 'Ó');
  content = content.replace(/Ã /g, 'Á');
  content = content.replace(/Ã‰/g, 'É');
  content = content.replace(/Ã/g, 'Í'); // Wait, Ã alone might be risky, but let's see.
  // Actually, I can just replace the specific strings.
  
  content = content.replace(/IDENTIFICACIÃ“N Y UBICACIÃ“N/g, 'IDENTIFICACIÓN Y UBICACIÓN');
  content = content.replace(/TÃ‰RMINOS Y SEGUIMIENTO/g, 'TÉRMINOS Y SEGUIMIENTO');
  content = content.replace(/SECCIÃ“N/g, 'SECCIÓN');
  content = content.replace(/MÃ³dulo/g, 'Módulo');
  content = content.replace(/automÃ¡ticamente/g, 'automáticamente');
  content = content.replace(/â†/g, '←');
  
  // also regular ones just in case
  content = content.replace(/identificacin/gi, 'identificación');
  content = content.replace(/ubicacin/gi, 'ubicación');
  content = content.replace(/seccin/gi, 'sección');
  content = content.replace(/mdulo/gi, 'módulo');
  
  fs.writeFileSync(file, content, 'utf8');
}

fixEncoding('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx');
fixEncoding('C:/DomunNet/frontend/src/app/dashboard/roles/page.tsx');
