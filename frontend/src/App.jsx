import { Routes, Route, Link } from 'react-router-dom'
import CatalogPage from './pages/CatalogPage'
import PracticePage from './pages/PracticePage'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <Link to="/" className="text-xl font-semibold text-slate-800 no-underline hover:text-slate-600 transition-colors">
          CLAIM Lab
        </Link>
        <span className="ml-3 text-sm text-slate-400">Практики по ИИ</span>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/practice/:id" element={<PracticePage />} />
        </Routes>
      </main>
    </div>
  )
}
