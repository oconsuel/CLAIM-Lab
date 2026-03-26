import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading, Button } from '../../components/ui'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        let detail = 'Ошибка входа'
        try {
          const data = JSON.parse(text)
          detail = data.detail || detail
        } catch {
          if (text) detail = text
        }
        throw new Error(detail)
      }
      const { token } = await res.json()
      localStorage.setItem('admin_token', token)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-slate-200 p-8 w-full max-w-sm"
      >
        <Heading as="h1" level="page" className="text-center">
          Вход в панель
        </Heading>

        {error && (
          <p className="text-sm text-red-600 mt-2 mb-3 text-center">{error}</p>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Логин
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            required
            autoComplete="username"
          />
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            required
            autoComplete="current-password"
          />
        </div>

        <Button
          variant="primary"
          className="w-full mt-5"
          disabled={loading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}
