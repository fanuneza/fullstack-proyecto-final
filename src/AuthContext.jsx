import { createContext, useCallback, useContext, useState } from 'react'
import { request } from './api'

export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  async function login(credentials) {
    const data = await request('/sesion', { method: 'POST', body: credentials })
    setSession(data)
    setSessionExpired(false)
  }
  function logout() { setSession(null); setSessionExpired(false) }
  const expireSession = useCallback(() => { setSession(null); setSessionExpired(true) }, [])
  return <AuthContext.Provider value={{ usuario: session?.usuario, token: session?.token, login, logout, sessionExpired, expireSession }}>
    {children}
  </AuthContext.Provider>
}
