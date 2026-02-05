const BASE_URL = 'https://api.track.toggl.com/api/v9'

// Helper pre API volania s Basic Auth
export const togglFetch = async (endpoint: string, apiKey: string) => {
  const headers = new Headers()
  headers.set('Authorization', 'Basic ' + btoa(apiKey + ':api_token'))
  headers.set('Content-Type', 'application/json')

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: headers,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}
