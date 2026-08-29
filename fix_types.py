import re

path = r"C:\DomunNet\frontend\src\types\proyecto.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

new_fields = """  nombreOficial?: string;
  descripcionProyecto?: string;
  direccion?: string;
  coordenadasMapa?: string;
  entidadContratante?: string;
  empresaContratista?: string;
  empresaSupervisora?: string;
  delegadoResidente?: string;
  fechaAdjudicacion?: string;
  numeroEscrituraPublica?: string;
  fechaInicioContractual?: string;
  montoContractualOriginal?: number;
  fechaFinalizacionReal?: string;
  plazoEjecucionRealAmpliado?: number;
  montoFinancieroFinalEjecutado?: number;"""

# Insert inside `export interface Proyecto {`
content = re.sub(
    r'(export interface Proyecto \{)',
    f'\\1\n{new_fields}',
    content
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Proyecto interface")
