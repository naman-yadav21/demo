const baseUrl = import.meta.env.VITE_LUMENORE_API_BASE_URL?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  if (!baseUrl) throw new ApiError('API base URL is not configured.')
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { Accept: 'application/json', ...options.headers },
    })
  } catch (cause) {
    throw new ApiError('Unable to reach the API.', { cause })
  }
  if (!response.ok) throw new ApiError(`API request failed (${response.status}).`, { status: response.status })
  if (response.status === 204) return null
  try {
    return await response.json()
  } catch (cause) {
    throw new ApiError('API response was not valid JSON.', { status: response.status, cause })
  }
}

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', headers: { 'Content-Type': 'application/json', ...options.headers }, body: JSON.stringify(body) }),
}
