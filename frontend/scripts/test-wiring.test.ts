import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('VERIFICACIÓN DE CONEXIÓN (test:wiring)', () => {
  it('HojaSabanaView.tsx debe llamar a calcularLiquidacionEstimacion y procesarMedicionRenglon sin duplicar lógica', () => {
    const hojaSabanaPath = path.resolve(__dirname, '../src/components/modules/proyectos/HojaSabanaView.tsx');
    expect(fs.existsSync(hojaSabanaPath)).toBe(true);

    const content = fs.readFileSync(hojaSabanaPath, 'utf8');

    // 1. Debe llamar a calcularLiquidacionEstimacion(
    expect(content).toContain('calcularLiquidacionEstimacion(');

    // 2. Debe llamar a procesarMedicionRenglon(
    expect(content).toContain('procesarMedicionRenglon(');

    // 3. No debe tener constantes/fórmulas duplicadas
    const contentWithoutImports = content
      .split('\n')
      .filter((line) => !line.trim().startsWith('import') && !line.trim().startsWith('//'))
      .join('\n');

    expect(contentWithoutImports).not.toContain('0.45');
    expect(contentWithoutImports).not.toContain('* 0.12');
    expect(contentWithoutImports).not.toContain('porcentajeIndirectos /');
  });

  it('Backend re-exporta y comparte las funciones puras de producción', () => {
    const backendIndexPath = path.resolve(__dirname, '../../backend/src/lib/calculos/index.ts');
    expect(fs.existsSync(backendIndexPath)).toBe(true);

    const beContent = fs.readFileSync(backendIndexPath, 'utf8');
    expect(beContent).toContain('calcularLiquidacionEstimacion');
    expect(beContent).toContain('procesarMedicionRenglon');
    expect(beContent).toContain('fechaFinActualizada');
  });
});
