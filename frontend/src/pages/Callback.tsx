import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { api, setAuthToken } from '@/lib/api'

export default function Callback() {
  const navigate = useNavigate()
  const { setUser } = useApp()

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : ''
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')

    if (!accessToken) {
      navigate('/login', { replace: true })
      return
    }

    const run = async () => {
      try {
        setAuthToken(accessToken)
        const profile = await api.getUserProfile()
        setUser({
          id: profile.sub,
          name: profile.name || profile.email.split('@')[0],
          email: profile.email,
          avatar: profile.picture,
        })
        navigate('/app', { replace: true })
      } catch (e) {
        navigate('/login', { replace: true })
      }
    }

    run()
  }, [navigate, setUser])

  return null
}
