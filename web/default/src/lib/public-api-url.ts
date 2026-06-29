function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '')
}

function getWindowOrigin(): string {
  if (typeof window === 'undefined') return ''
  return trimTrailingSlashes(window.location.origin)
}

function normalizeConfiguredOrigin(value: string): string {
  const trimmed = trimTrailingSlashes(value.trim())
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    if (url.pathname === '/v1') {
      url.pathname = ''
    }
    return trimTrailingSlashes(url.toString())
  } catch {
    return trimmed.replace(/\/v1$/i, '')
  }
}

function inferApiOrigin(origin: string): string {
  if (!origin) return ''

  try {
    const url = new URL(origin)
    if (url.hostname.startsWith('www.')) {
      url.hostname = `api.${url.hostname.slice(4)}`
    }
    return trimTrailingSlashes(url.toString())
  } catch {
    return trimTrailingSlashes(origin)
  }
}

export function resolvePublicApiOrigin(configuredOrigin?: string): string {
  const normalizedConfiguredOrigin = normalizeConfiguredOrigin(
    configuredOrigin || ''
  )
  if (normalizedConfiguredOrigin) return normalizedConfiguredOrigin

  return inferApiOrigin(getWindowOrigin())
}

export function buildPublicApiUrl(
  configuredOrigin: string | undefined,
  path: string
): string {
  const origin = resolvePublicApiOrigin(configuredOrigin)
  if (!origin) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalizedPath}`
}
