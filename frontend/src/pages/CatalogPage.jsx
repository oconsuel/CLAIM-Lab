import { useState } from 'react'
import { Link } from 'react-router-dom'
import practices, { categoryColors, categoryLabels } from '../data/practices'
import { Heading, Text, Button } from '../components/ui'

const categories = [
  { key: 'Все', label: 'Все' },
  { key: 'ML', label: categoryLabels.ML },
  { key: 'CV', label: categoryLabels.CV },
  { key: 'NLP', label: categoryLabels.NLP },
  { key: 'Generative', label: categoryLabels.Generative },
  { key: 'Data', label: categoryLabels.Data },
]

export default function CatalogPage() {
  const [filter, setFilter] = useState('Все')

  const filtered = filter === 'Все'
    ? practices
    : practices.filter(p =>
        Array.isArray(p.category) ? p.category.includes(filter) : p.category === filter
      )

  return (
    <div>
      <Heading as="h1" level="page">Каталог практик</Heading>
      <Text variant="muted" className="mb-6">Выберите практику и начните изучать ИИ на реальных задачах</Text>

      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat.key}
            variant="selector"
            selected={filter === cat.key}
            onClick={() => setFilter(cat.key)}
            className="rounded-full px-4 py-1.5 min-w-0"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(practice => (
          <PracticeCard key={practice.id} practice={practice} />
        ))}
      </div>
    </div>
  )
}

function PracticeCard({ practice }) {
  const cats = Array.isArray(practice.category) ? practice.category : [practice.category]

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex gap-1.5 flex-wrap mb-3">
        {cats.map(cat => {
          const c = categoryColors[cat] || categoryColors.ML
          return (
            <span key={cat} className={`self-start px-2.5 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text} ${c.border} border`}>
              {categoryLabels[cat] || cat}
            </span>
          )
        })}
      </div>
      <Heading as="h3" level="card">{practice.title}</Heading>
      <Text variant="muted" className="mb-4 flex-1">{practice.description}</Text>
      <Button as={Link} to={`/practice/${practice.id}`} variant="primary" className="inline-block text-center w-full no-underline">
        Открыть
      </Button>
    </div>
  )
}
