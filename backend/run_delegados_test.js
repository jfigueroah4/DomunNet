require('dotenv').config({ path: 'C:/DomunNet/backend/.env' })
const jwt = require('jsonwebtoken')
// Using built‑in fetch (Node >=18) – no explicit import needed

async function test() {
  const token = jwt.sign({ id: 'test-id', correo: 'test@domunnet.test', rol: 'Administrador', permisos: ['usuarios.read'] }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const urls = [
    'http://localhost:3001/api/v1/usuarios/delegados_residente',
    'http://localhost:3001/api/v1/usuarios/delegados_residente?busqueda=admin'
  ]
  for (const url of urls) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const body = await res.text()
    console.log('---')
    console.log(`GET ${url}`)
    console.log(`Status: ${res.status}`)
    console.log('Body:', body)
  }
}

test().catch(err => console.error('Error:', err))
