import re

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# First, extract EstadoVacio render inside tbody
old_render = """        {data.length === 0 && !loading ? (
          <div className="flex-1 overflow-auto bg-gray-50/30">
             <div className="p-10 flex justify-center">
                <EstadoVacio onCrear={handleCreate} />
             </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto relative flex-1">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-20">"""

new_render = """        <div className="w-full overflow-x-auto relative flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-20">"""

content = content.replace(old_render, new_render)

# Now, handle the closing part of data.length === 0 condition
old_table_close = """              </tbody>
            </table>
          </div>
        )}"""

new_table_close = """              </tbody>
          </table>
        </div>"""

content = content.replace(old_table_close, new_table_close)


# Inject EstadoVacio into tbody when data is empty and not loading
old_tbody = """              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 bg-white">
                      <div className="flex flex-col items-center">
                        <div className="h-6 w-6 border-2 border-[#9B0F06] border-t-transparent rounded-full animate-spin mb-3"></div>
                        <span className="text-[10px] font-medium">Cargando datos...</span>
                      </div>
                    </td>
                  </tr>
                ) : ("""

new_tbody = """              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 bg-white">
                      <div className="flex flex-col items-center">
                        <div className="h-6 w-6 border-2 border-[#9B0F06] border-t-transparent rounded-full animate-spin mb-3"></div>
                        <span className="text-[10px] font-medium">Cargando datos...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-16 text-center bg-gray-50/30">
                      <div className="flex justify-center w-full">
                         <EstadoVacio onCrear={handleCreate} />
                      </div>
                    </td>
                  </tr>
                ) : ("""

content = content.replace(old_tbody, new_tbody)


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
