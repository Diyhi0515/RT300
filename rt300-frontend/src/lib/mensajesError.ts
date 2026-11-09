const porCodigo: Record<string, string> = {
  CREDENCIALES_INVALIDAS: 'Usuario o contraseña incorrectos.',
  USUARIO_SIN_PERMISO: 'Tu usuario no tiene permiso para esta operación.',
  MESA_OCUPADA: 'La mesa ya está ocupada.',
  MESA_LIBRE: 'La mesa ya está libre.',
  GATEWAY_UNAVAILABLE: 'El servicio de comandas no está disponible. Intenta nuevamente.',
  NETWORK_ERROR: 'No hay conexión con el servidor. Revisa tu red.',
  TIMEOUT: 'El servidor tardó demasiado en responder. Intenta nuevamente.',
}

const porEstado: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'Tu sesión expiró. Inicia sesión nuevamente.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No se encontró lo que buscas.',
  409: 'La operación entra en conflicto con el estado actual.',
  422: 'Revisa los datos ingresados.',
  429: 'Demasiados intentos. Espera un momento.',
  500: 'Error interno del servidor. Intenta más tarde.',
  502: 'El servidor no está disponible por ahora.',
  503: 'El servicio no está disponible por ahora.',
  504: 'El servidor tardó demasiado en responder.',
}

export const ERROR_POR_DEFECTO = 'Ocurrió un error inesperado. Intenta nuevamente.'

export const resolverMensajeError = (code: string | undefined, status: number, server?: string) =>
  (code && porCodigo[code]) || server || porEstado[status] || ERROR_POR_DEFECTO
