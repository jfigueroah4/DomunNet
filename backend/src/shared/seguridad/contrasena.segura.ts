import crypto from 'crypto'

const iteraciones = 120000
const longitudClave = 64

export function generarHashContrasena(contrasena: string) {
  const sal = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(contrasena, sal, iteraciones, longitudClave, 'sha512').toString('hex')
  return {
    sal,
    hash,
  }
}

export function verificarContrasena(contrasena: string, sal: string, hashEsperado: string) {
  const hashCalculado = crypto.pbkdf2Sync(contrasena, sal, iteraciones, longitudClave, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hashCalculado, 'hex'), Buffer.from(hashEsperado, 'hex'))
}
