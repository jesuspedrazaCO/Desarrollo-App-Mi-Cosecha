import { createContext, useState, useEffect } from 'react'
import { clearCache } from '../lib/offlineQueue'
import {
  login as loginService, register as registerService, acceptInvitation as acceptInvitationService,
} from '../services/authService'

export const AuthContext = createContext(null)

// Sin internet no se puede comprobar la contraseña (el servidor es quien la valida): se explica con claridad
const NEEDS_INTERNET = 'Para iniciar sesión por primera vez en este celular necesitas internet. Después podrás abrir la app sin conexión. Si ya habías entrado, no cierres sesión.'
const withOfflineMessage = async (fn) => {
  try {
    return await fn()
  } catch (err) {
    if (!err?.response && (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || !navigator.onLine)) {
      err.response = { status: 0, data: { message: NEEDS_INTERNET } }
    }
    throw err
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await withOfflineMessage(() => loginService({ email, password }))
    const { token, user: userData } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (data) => {
    const res = await withOfflineMessage(() => registerService(data))
    const { token, user: userData } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  // El invitado elige su contraseña con el enlace del correo y entra directo
  const acceptInvitation = async (invitationToken, password) => {
    const res = await withOfflineMessage(() => acceptInvitationService(invitationToken, password))
    const { token, user: userData } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    // Se borran los datos guardados para leer sin internet; los registros pendientes de subir se conservan
    clearCache()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // Las sesiones anteriores no traen "role": se tratan como administrador.
  // isViewer = lector (solo ve datos y descarga PDF). isEditor = además registra/edita/borra datos.
  // isAdmin = dueño de la finca (también gestiona miembros). canEdit = puede registrar/editar/borrar.
  const isViewer = user?.role === 'viewer'
  const isEditor = user?.role === 'editor'
  const isAdmin = !!user && !isViewer && !isEditor
  const canEdit = isAdmin || isEditor

  return (
    <AuthContext.Provider value={{ user, loading, login, register, acceptInvitation, logout, updateUser, isViewer, isEditor, isAdmin, canEdit }}>
      {children}
    </AuthContext.Provider>
  )
}