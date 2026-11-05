import { useEffect, useState } from 'react'
import { request } from './api'
import { useAuth } from './AuthContext'

export function useResource(path, token) {
  const { expireSession } = useAuth()
  const [resource, setResource] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setResource({ loading: true })
    request(path, { token }).then(
      data => { if (active) setResource({ data }) },
      error => {
        if (active && token && error.status === 401) expireSession()
        else if (active) setResource({ error })
      },
    )
    return () => { active = false }
  }, [path, token, attempt, expireSession])
  return { ...resource, retry: () => setAttempt(value => value + 1) }
}
