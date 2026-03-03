import { useState } from 'react'
import ParamControl from './ParamControl'
import ResultDisplay from './ResultDisplay'
import { Heading, Text, Button } from './ui'
import { runBeginner } from '../api'

export default function BeginnerMode({ practice }) {
  const config = practice.beginner
  const [params, setParams] = useState(() => {
    const initial = {}
    config.params.forEach(p => { initial[p.name] = p.default })
    return initial
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await runBeginner(practice.id, params)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Heading as="h3" level="block">Начинающий</Heading>
      <Text variant="mutedLight" className="mb-5">Настройте параметры и нажмите «Запустить» — модель обучится автоматически</Text>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {config.params.map(param => (
          <ParamControl
            key={param.name}
            param={param}
            value={params[param.name]}
            onChange={val => setParams(prev => ({ ...prev, [param.name]: val }))}
          />
        ))}
      </div>

      <Button variant="primary" onClick={handleRun} disabled={loading}>
        {loading ? 'Запуск...' : 'Запустить'}
      </Button>

      <ResultDisplay result={result} loading={false} error={error} />
    </div>
  )
}
