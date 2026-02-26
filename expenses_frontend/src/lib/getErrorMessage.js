export function getErrorMessage(error, fallback = 'Ocurrio un error inesperado.') {
  const payload = error?.response?.data
  const apiMessage = payload?.message ?? payload?.data?.message

  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage
  }

  if (Array.isArray(apiMessage)) {
    return apiMessage.join(' ')
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }

  return fallback
}
