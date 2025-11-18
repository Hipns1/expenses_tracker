export const API_URL = import.meta.env.VITE_API_URL as string | undefined
export const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL as string | undefined) ?? '/'

const SESSION_ACTIVE_MINUTES = (import.meta.env.VITE_SESSION_ACTIVE_MINUTES as number | undefined) ?? 10
const SESSION_REFRESH_MINUTES = (import.meta.env.VITE_SESSION_REFRESH_MINUTES as number | undefined) ?? 5
export const SESSION_MINUTES = {
  SESSION_ACTIVE_MINUTES: SESSION_ACTIVE_MINUTES * 60 * 1000,
  SESSION_REFRESH_MINUTES: SESSION_REFRESH_MINUTES * 60 * 1000
}
