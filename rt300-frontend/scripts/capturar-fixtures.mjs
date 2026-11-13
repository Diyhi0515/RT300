// Captura respuestas REALES del backend para usarlas como fixtures de contrato en las pruebas.
// Anonimiza nombres de personas y NIT antes de guardar. Uso: npm run fixtures  (backend en http://127.0.0.1:5000)
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = process.env.API_URL ?? 'http://127.0.0.1:5000/api/v1'
const USUARIO = process.env.API_USUARIO ?? 'GP1'
const CLAVE = process.env.API_CLAVE ?? '123456'
const SALIDA = fileURLToPath(new URL('../src/test/fixtures/', import.meta.url))

const CLAVES_PERSONA = new Set(['nombre', 'mozo', 'cliente', 'nomb'])
const CLAVES_DOCUMENTO = new Set(['nruc', 'ndid'])

const anonimizar = (valor, contador = { n: 0 }) => {
  if (Array.isArray(valor)) return valor.map((v) => anonimizar(v, contador))
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, v]) => {
        if (CLAVES_PERSONA.has(clave) && typeof v === 'string' && v.trim()) {
          contador.n += 1
          return [clave, `${clave.toUpperCase()} ${contador.n}`]
        }
        if (CLAVES_DOCUMENTO.has(clave) && v !== null) return [clave, '0']
        return [clave, anonimizar(v, contador)]
      }),
    )
  }
  return valor
}

const pedir = async (ruta, token, opciones = {}) => {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!respuesta.ok) throw new Error(`${opciones.method ?? 'GET'} ${ruta} -> ${respuesta.status}`)
  return respuesta.json()
}

const guardar = async (nombre, datos) => {
  await writeFile(`${SALIDA}${nombre}.json`, `${JSON.stringify(datos, null, 2)}\n`)
  console.log(`  ${nombre}.json`)
}

await mkdir(SALIDA, { recursive: true })
console.log(`Capturando desde ${BASE} como ${USUARIO}`)

const login = await pedir('/auth/login', null, { method: 'POST', body: JSON.stringify({ usuario: USUARIO, clave: CLAVE }) })
const token = login.access_token

await guardar('login', anonimizar({ ...login, access_token: 'token-de-acceso', refresh_token: 'token-de-renovacion' }))
await guardar('usuarios', anonimizar({ usuarios: (await pedir('/auth/usuarios')).usuarios.slice(0, 5) }))
const parametros = await pedir('/salon/parametros', token)
await guardar('parametros', anonimizar({ ...parametros, mesas: parametros.mesas.slice(0, 3), meseros: parametros.meseros.slice(0, 2) }))

const { mesas } = await pedir('/salon/mesas', token)
const ocupada = mesas.filter((m) => m.folio).sort((a, b) => b.cuentas - a.cuentas)[0]
const libre = mesas.find((m) => !m.folio)
await guardar('mesas', anonimizar({ mesas: [libre, ocupada, ...mesas.slice(0, 2)].filter(Boolean) }))

const detalle = await pedir(`/salon/folios/${ocupada.folio}/detalle`, token)
await guardar('detalle-folio', anonimizar({ cuentas: detalle.cuentas.filter((c) => c.lineas.length).slice(0, 3) }))

const secciones = await pedir('/menu/secciones', token)
await guardar('secciones', { secciones: secciones.secciones.slice(0, 12) })
await guardar('platos', { platos: (await pedir('/menu/secciones/1/0/platos', token)).platos.slice(0, 6) })
await guardar('clientes-busqueda', anonimizar({ clientes: (await pedir('/clientes?nombre=garcia', token)).clientes.slice(0, 3) }))
await guardar('cliente-detalle', anonimizar(await pedir('/clientes?codigo=17', token)))
console.log('Listo. Revise los archivos antes de subirlos: deben estar sin datos personales.')
