import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Heading, Button } from '../../components/ui'
import StatCard from '../../components/admin/StatCard'
import practices from '../../data/practices'

async function adminFetch(url) {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    window.location.href = '/admin/login'
    return null
  }
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json()
}

function practiceTitleMap() {
  const map = {}
  practices.forEach((p) => {
    map[p.id] = p.title
  })
  return map
}

const titles = practiceTitleMap()

function formatDateRu(isoDate) {
  // isoDate: YYYY-MM-DD
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

function InfoTip({ text }) {
  return (
    <span className="relative inline-flex items-center">
      <span
        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-300 text-[10px] text-slate-500 cursor-help"
        title={text}
        aria-label={text}
      >
        i
      </span>
    </span>
  )
}

function RunsTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  const practicesBreakdown = row.practices || {}
  const entries = Object.entries(practicesBreakdown)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
      <div className="text-xs text-slate-500 mb-1">{formatDateRu(row.date)}</div>
      <div className="text-sm font-medium text-slate-800">
        Всего запросов: {row.total_runs || 0}
      </div>
      {entries.length > 0 && (
        <div className="mt-2 space-y-1">
          {entries.map(([pid, cnt]) => (
            <div key={pid} className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-700">
                {titles[pid] || pid}
              </span>
              <span className="text-xs font-mono text-slate-500">{cnt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    adminFetch('/api/admin/analytics')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  if (loading)
    return <p className="text-sm text-slate-500">Загрузка...</p>
  if (!data)
    return <p className="text-sm text-red-600">Ошибка загрузки данных</p>

  const allRows = practices.map((p) => {
    const pid = p.id
    const visits = data.visits_by_practice?.[pid] || 0
    const runs = data.runs_by_practice?.[pid] || 0
    const errors = data.errors_by_practice?.[pid] || 0
    const enabled =
      data.practice_status?.[pid] === undefined ? true : data.practice_status?.[pid]
    return {
      practice_id: pid,
      title: p.title,
      visits,
      runs,
      errors,
      status: enabled ? 'активен' : 'скрыт',
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Heading as="h1" level="page">
          Панель управления
        </Heading>
        <div className="flex gap-2">
          <Button
            as={Link}
            to="/admin/practices"
            variant="secondary"
            className="no-underline"
          >
            Практикумы
          </Button>
          <Button variant="ghost" onClick={logout}>
            Выйти
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Количество запусков практикумов"
          value={data.total_runs}
          subtitle="= нажатия «Запустить»"
        />
        <StatCard
          title="Общее число посещений практикумов"
          value={data.total_visits}
          subtitle="= переходы на страницы практикумов"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-8">
        <div className="flex items-center">
          <Heading as="h2" level="section" className="mb-0">
            Статистика по практикумам
          </Heading>
          <InfoTip text="Посещения — переходы на страницу практикума. Запуски — нажатия «Запустить». Ошибки — неуспешные запуски (HTTP ≥ 400). Статус берётся из настроек видимости." />
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-slate-500 font-medium">
                  Практикум
                </th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">
                  Количество посещений
                </th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">
                  Кол-во запусков
                </th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">
                  Кол-во ошибок
                </th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((r) => (
                <tr
                  key={r.practice_id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2 px-3 text-slate-700">{r.title}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {r.visits}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {r.runs}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-mono ${
                      r.errors > 0 ? 'text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {r.errors}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requests over time */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-8">
        <div className="flex items-center">
          <Heading as="h2" level="section" className="mb-0">
            Запросы за последние 30 дней
          </Heading>
          <InfoTip text="Считаются только запуски практикумов (нажатия «Запустить»). В тултипе — разбивка по практикумам." />
        </div>
        {data.by_day.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => formatDateRu(v)}
                />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<RunsTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total_runs"
                  stroke="#334155"
                  strokeWidth={2}
                  dot={false}
                  name="Запросы"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-400 mt-2">Нет данных</p>
        )}
      </div>

      {/* Avg response time & Error rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center">
            <Heading as="h2" level="section" className="mb-0">
              Среднее время ответа
            </Heading>
            <InfoTip text="Среднее время ответа на запуск практикума (секунды). Считается по эндпоинтам /run-*" />
          </div>
          <div className="space-y-3 mt-3">
            {Object.entries(data.avg_run_time_ms || {}).map(([pid, avgMs]) => (
              <div key={pid} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">
                  {titles[pid] || pid}
                </span>
                <span className="text-sm font-mono text-slate-500">
                  {(Number(avgMs) / 1000).toFixed(2)} сек
                </span>
              </div>
            ))}
            {Object.keys(data.avg_run_time_ms || {}).length === 0 && (
              <p className="text-sm text-slate-400">Нет данных</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center">
            <Heading as="h2" level="section" className="mb-0">
              Ошибки запусков
            </Heading>
            <InfoTip text="Количество неуспешных запусков (HTTP ≥ 400) по практикумам." />
          </div>
          <div className="space-y-3 mt-3">
            {Object.entries(data.errors_by_practice || {}).map(([pid, cnt]) => (
              <div key={pid} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">
                  {titles[pid] || pid}
                </span>
                <span
                  className={`text-sm font-mono ${
                    Number(cnt) > 0 ? 'text-red-600' : 'text-slate-500'
                  }`}
                >
                  {cnt}
                </span>
              </div>
            ))}
            {Object.keys(data.errors_by_practice || {}).length === 0 && (
              <p className="text-sm text-slate-400">Нет данных</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
