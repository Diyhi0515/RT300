import { z } from 'zod'

export const esquemaFormularioInicio = z.object({
  usuario: z.string().trim().min(1, 'Ingresa tu usuario').max(20, 'Usuario demasiado largo'),
  clave: z.string().min(1, 'Ingresa tu contraseña').max(64, 'Contraseña demasiado larga'),
})

export type DatosFormularioInicio = z.infer<typeof esquemaFormularioInicio>

export const esquemaPerfil = z.object({
  usuario: z.string(),
  nombre: z.string(),
  local: z.string(),
  rol: z.enum(['garzon', 'cajero', 'admin']),
})

export const esquemaRespuestaInicio = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  perfil: esquemaPerfil,
})

export const esquemaRespuestaUsuarios = z.object({
  usuarios: z.array(z.object({ usuario: z.string(), nombre: z.string() })),
})
