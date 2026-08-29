import re

path = r"C:\DomunNet\backend\src\modules\mantenimiento\mantenimiento.controller.ts"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the catch block
old_catch = """    } catch (error: any) {
      return sendError(res, 500, `Error al listar ${tabla}`, error.message)
    }"""

new_catch = """    } catch (error: any) {
      console.error(`[Mantenimiento Controller] Error real al listar ${tabla}:`, error);
      return sendError(res, 500, `Error al listar ${tabla}`, error.message)
    }"""

content = content.replace(old_catch, new_catch)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added console.error")
