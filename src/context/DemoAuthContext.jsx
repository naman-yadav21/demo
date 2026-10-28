import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_EMPLOYEE, DEMO_ROLE_USERS } from '../constants/demoUsers.js'

const DemoAuthContext = createContext(null)
const SESSION_KEY = 'traveldesk-demo-signed-in'
const USER_KEY = 'traveldesk-demo-user'

function safeSessionUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

function readSignedInUser() {
  let signedIn = false
  let storedUser = null
  try {
    signedIn = window.localStorage.getItem(SESSION_KEY) === 'true'
    storedUser = window.localStorage.getItem(USER_KEY)
  } catch {
    try {
      signedIn = window.sessionStorage.getItem(SESSION_KEY) === 'true'
      storedUser = window.sessionStorage.getItem(USER_KEY)
    } catch {
      return null
    }
  }

  if (!signedIn) {
    try {
      signedIn = window.sessionStorage.getItem(SESSION_KEY) === 'true'
      storedUser = storedUser || window.sessionStorage.getItem(USER_KEY)
    } catch {
      return null
    }
  }
  if (!signedIn) return null

  try {
    const parsedUser = storedUser ? JSON.parse(storedUser) : null
    const matchingUser = DEMO_ROLE_USERS.find((user) => user.id === parsedUser?.id && user.role === parsedUser?.role)
    const sessionUser = safeSessionUser(matchingUser || DEMO_EMPLOYEE)
    if (!parsedUser) {
      try {
        window.localStorage.setItem(USER_KEY, JSON.stringify(sessionUser))
      } catch {
        // Existing sessions from older builds continue as the default employee demo.
      }
    }
    return sessionUser
  } catch {
    return safeSessionUser(DEMO_EMPLOYEE)
  }
}

export function DemoAuthProvider({ children }) {
  const [user, setUser] = useState(readSignedInUser)
  const isAuthenticated = Boolean(user)

  useEffect(() => {
    function syncSignInAcrossTabs(event) {
      if (event.key !== SESSION_KEY && event.key !== USER_KEY && event.key !== null) return
      setUser(readSignedInUser())
    }

    window.addEventListener('storage', syncSignInAcrossTabs)
    return () => window.removeEventListener('storage', syncSignInAcrossTabs)
  }, [])

  const login = useCallback((email, password) => {
    const matchedUser = DEMO_ROLE_USERS.find((candidate) => candidate.email.toLowerCase() === email?.trim().toLowerCase() && candidate.password === password)
    if (!matchedUser) return { success: false, reason: 'credentials' }

    const sessionUser = safeSessionUser(matchedUser)
    try {
      window.localStorage.setItem(USER_KEY, JSON.stringify(sessionUser))
      window.localStorage.setItem(SESSION_KEY, 'true')
    } catch {
      try {
        window.localStorage.removeItem(USER_KEY)
        window.localStorage.removeItem(SESSION_KEY)
      } catch {
        // Leave state unauthenticated if persistent demo sign-in cannot be saved.
      }
      return { success: false, reason: 'storage' }
    }
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(USER_KEY)
    } catch {
      // Persistent sign-in has already been stored.
    }
    setUser(sessionUser)
    return { success: true, user: sessionUser }
  }, [])

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY)
      window.localStorage.removeItem(USER_KEY)
      window.sessionStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(USER_KEY)
    } catch {
      // Always close the current app session, even if browser storage is unavailable.
    }
    setUser(null)
  }, [])

  const value = useMemo(() => ({ isAuthenticated, user, login, logout }), [isAuthenticated, user, login, logout])
  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>
}

export function useDemoAuth() {
  const value = useContext(DemoAuthContext)
  if (!value) throw new Error('useDemoAuth must be used within DemoAuthProvider')
  return value
}
