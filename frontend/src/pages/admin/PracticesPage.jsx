import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heading, Text, Button } from '../../components/ui'
import PracticeToggle from '../../components/admin/PracticeToggle'
import practices from '../../data/practices'

async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    window.location.href = '/admin/login'
    return null
  }
  if (!res.ok) throw new Error('Ошибка')
  return res.json()
}

export default function PracticesPage() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    adminFetch('/api/admin/practices')
      .then((rows) => {
        if (!rows) return
        const map = {}
        rows.forEach((r) => (map[r.practice_id] = !!r.is_enabled))
        setSettings(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (id, enabled) => {
    setSettings((prev) => ({ ...prev, [id]: enabled }))
    await adminFetch(`/api/admin/practices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_enabled: enabled }),
    })
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  if (loading)
    return <p className="text-sm text-slate-500">Загрузка...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Heading as="h1" level="page">
          Управление практикумами
        </Heading>
        <div className="flex gap-2">
          <Button
            as={Link}
            to="/admin"
            variant="secondary"
            className="no-underline"
          >
            Дашборд
          </Button>
          <Button variant="ghost" onClick={logout}>
            Выйти
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
        <Text variant="body" className="!text-amber-800 text-xs font-medium">
          Изменения вступают в силу немедленно
        </Text>
      </div>

      <div className="space-y-2">
        {practices.map((p) => (
          <PracticeToggle
            key={p.id}
            label={p.title}
            description={p.description}
            enabled={settings[p.id] !== false}
            onChange={(val) => toggle(p.id, val)}
          />
        ))}
      </div>
    </div>
  )
}
