export interface TimeEntry {
  id: number
  description: string
  client?: string
  start: string
  stop: string
  duration: number
  pid?: number // Project ID
  wid?: number // Workspace ID
  tags?: string[]
}

export interface Project {
  id: number
  name: string
  color: string
}

export interface UserProfile {
  id: number
  email: string
  fullname: string
  api_token?: string
}
