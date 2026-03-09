import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import practices from '../data/practices'
import BeginnerMode from '../components/BeginnerMode'
import ResearcherMode from '../components/ResearcherMode'
import PixelGrid from '../components/PixelGrid'
import { Heading, Text, Button } from '../components/ui'
import { fetchDatasetSamples } from '../api'

const modes = [
  { key: 'beginner', label: 'Начинающий' },
  { key: 'researcher', label: 'Начинающий исследователь' },
]

export default function PracticePage() {
  const { id } = useParams()
  const [mode, setMode] = useState('beginner')
  const [datasetDigit, setDatasetDigit] = useState(5)
  const [datasetSamples, setDatasetSamples] = useState([])
  const [datasetLoading, setDatasetLoading] = useState(false)
  const [datasetError, setDatasetError] = useState(null)

  const practice = practices.find(p => p.id === id)

  const loadDatasetSamples = async (digit) => {
    if (practice?.id !== 'image-generation') return
    setDatasetLoading(true)
    setDatasetError(null)
    try {
      const data = await fetchDatasetSamples(digit)
      setDatasetSamples(data.samples || [])
    } catch (e) {
      setDatasetError(e.message)
      setDatasetSamples([])
    } finally {
      setDatasetLoading(false)
    }
  }

  useEffect(() => {
    if (practice?.id === 'image-generation') {
      loadDatasetSamples(datasetDigit)
    }
  }, [practice?.id, datasetDigit])

  if (!practice) {
    return (
      <div className="text-center py-16">
        <Heading as="h2" level="card" className="text-xl mb-2">Практика не найдена</Heading>
        <Link to="/" className="text-sm text-blue-600 hover:underline">Вернуться в каталог</Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 no-underline mb-4 inline-block">
        &larr; Каталог
      </Link>

      <Heading as="h1" level="page">{practice.title}</Heading>

      {practice.pedagogy?.goal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Heading as="h2" level="pedagogy" color="blue">Цель практики</Heading>
          <Text className="text-blue-800">{practice.pedagogy.goal}</Text>
        </div>
      )}

      <section className="bg-white rounded-lg border border-slate-200 p-5 mb-6">
        <Heading as="h2" level="section">Контекст</Heading>
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {practice.context}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-5 mb-6">
        <Heading as="h2" level="section">Пример данных</Heading>
        {practice.id === 'image-generation' ? (
          <div className="space-y-1">
            <Text variant="muted">
              Выберите цифру, чтобы посмотреть 20 случайных примеров-изображений из датасета
            </Text>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                  <Button
                    key={d}
                    variant="selector"
                    selected={datasetDigit === d}
                    onClick={() => setDatasetDigit(d)}
                  >
                    {d}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                disabled={datasetLoading}
                onClick={() => loadDatasetSamples(datasetDigit)}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                }
                iconPosition="right"
              >
                Обновить данные
              </Button>
            </div>
            {datasetError && (
              <Text variant="error" className="mb-2">{datasetError}</Text>
            )}
            {datasetLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-8">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600" />
                Загрузка…
              </div>
            ) : datasetSamples.length > 0 ? (
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-3">
                {datasetSamples.map((pixels, i) => (
                  <div key={i} className="flex justify-center">
                    <PixelGrid pixels={pixels} size={8} cellSize={10} />
                  </div>
                ))}
              </div>
            ) : (
              <Text variant="mutedLight" className="py-4">Нет данных</Text>
            )}
          </div>
        ) : practice.sampleData?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {Object.keys(practice.sampleData[0]).map(key => (
                    <th key={key} className="text-left py-2 px-3 text-slate-500 font-medium">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {practice.sampleData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="py-2 px-3 text-slate-700 font-mono text-sm">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
        {modes.map(m => (
          <Button
            key={m.key}
            variant="modeSwitch"
            selected={mode === m.key}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      <section className="bg-white rounded-lg border border-slate-200 p-5">
        {mode === 'beginner' && <BeginnerMode practice={practice} />}
        {mode === 'researcher' && <ResearcherMode practice={practice} />}
      </section>

      {practice.pedagogy && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {practice.pedagogy.hints?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <Heading as="h3" level="pedagogy" color="amber">Что попробовать изменить</Heading>
              <ul className="space-y-1.5">
                {practice.pedagogy.hints.map((hint, i) => (
                  <li key={i} className="text-sm text-amber-800 flex gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {practice.pedagogy.question && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <Heading as="h3" level="pedagogy" color="violet">Вопрос для размышления</Heading>
              <Text className="text-violet-800">{practice.pedagogy.question}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
