import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

type Props = { children: React.ReactNode }

const PublicOnly = ({ children }: Props) => {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!cancelled) setAuthed(res.ok)
      } catch {
        if (!cancelled) setAuthed(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (authed) return <Navigate to="/admin" replace />
  return children
}

export default PublicOnly