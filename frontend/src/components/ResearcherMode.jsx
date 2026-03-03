import { useState } from 'react'
import ParamControl from './ParamControl'
import ResultDisplay from './ResultDisplay'
import { Heading, Text, Button } from './ui'
import { runResearcher } from '../api'

export default function ResearcherMode({ practice }) {
  const config = practice.researcher
  const [selectedModel, setSelectedModel] = useState(config.models[0].value)
  const [params, setParams] = useState(() => buildDefaults(config.params[config.models[0].value]))
  const [runs, setRuns] = useState([])
  const [latestResult, setLatestResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function buildDefaults(paramDefs) {
    const d = {}
    paramDefs?.forEach(p => { d[p.name] = p.default })
    return d
  }

  const handleModelChange = (model) => {
    setSelectedModel(model)
    setParams(buildDefaults(config.params[model]))
  }

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await runResearcher(practice.id, selectedModel, params)
      setLatestResult(data)
      const modelLabel = config.models.find(m => m.value === selectedModel)?.label || selectedModel
      setRuns(prev => [
        { id: Date.now(), model: modelLabel, params: { ...params }, metric: data.metric },
        ...prev,
      ].slice(0, 3))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentParams = config.params[selectedModel] || []
  const bestRun = runs.length > 0 ? runs.reduce((a, b) => a.metric > b.metric ? a : b) : null

  return (
    <div>
      <Heading as="h3" level="block">Начинающий исследователь</Heading>
      <Text variant="mutedLight" className="mb-5">Выберите модель, настройте параметры и сравните результаты</Text>

      <div className="mb-5">
        <Text as="label" variant="body" className="block mb-2 text-slate-600">Модель</Text>
        <div className="flex gap-2">
          {config.models.map(m => (
            <Button
              key={m.value}
              variant="selector"
              selected={selectedModel === m.value}
              onClick={() => handleModelChange(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {currentParams.map(param => (
          <ParamControl
            key={`${selectedModel}-${param.name}`}
            param={param}
            value={params[param.name]}
            onChange={val => setParams(prev => ({ ...prev, [param.name]: val }))}
          />
        ))}
      </div>

      <Button variant="primary" onClick={handleRun} disabled={loading}>
        {loading ? 'Запуск...' : 'Запустить'}
      </Button>

      <ResultDisplay result={latestResult} loading={false} error={error} />

      {runs.length > 0 && (
        <div className="mt-6">
          <Heading as="h4" level="section">История запусков</Heading>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-slate-500 font-medium">#</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Модель</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Точность</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => (
                <tr
                  key={run.id}
                  className={`border-b border-slate-100 ${bestRun && run.id === bestRun.id ? 'bg-green-50' : ''}`}
                >
                  <td className="py-2 px-3 text-slate-400">{runs.length - i}</td>
                  <td className="py-2 px-3 text-slate-700">{run.model}</td>
                  <td className="py-2 px-3 font-mono text-slate-800">
                    {(run.metric * 100).toFixed(1)}%
                    {bestRun && run.id === bestRun.id && (
                      <span className="ml-2 text-xs text-green-600 font-sans">лучший</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
