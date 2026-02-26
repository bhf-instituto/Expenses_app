function getByPath(source, path) {
  return path.split('.').reduce((acc, segment) => acc?.[segment], source)
}

export function ensureApiOk(data) {
  if (data?.ok === false) {
    const message = pickFirst(data, ['data.message', 'message'], 'Request failed.')
    const error = new Error(message)
    error.response = { data }
    throw error
  }

  return data
}

export function pickFirst(source, paths, fallback = null) {
  for (const path of paths) {
    const value = getByPath(source, path)
    if (value !== undefined && value !== null) {
      return value
    }
  }

  return fallback
}

export function pickArray(source, paths) {
  const value = pickFirst(source, paths, [])
  return Array.isArray(value) ? value : []
}
