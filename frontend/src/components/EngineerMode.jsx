import { useState } from 'react'
import Editor from '@monaco-editor/react'
import ResultDisplay from './ResultDisplay'
import { Heading, Text, Button } from './ui'
import { runEngineer } from '../api'

export default function EngineerMode({ practice }) {
  const [code, setCode] = useState(practice.engineer.template)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await runEngineer(practice.id, code)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCode(practice.engineer.template)
    setResult(null)
    setError(null)
  }

  return (
    <div>
      <Heading as="h3" level="block">Начинающий инженер</Heading>
      <Text variant="mutedLight" className="mb-5">Напишите свой код — модифицируйте шаблон или создайте решение с нуля</Text>

      <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
        <Editor
          height="350px"
          defaultLanguage="python"
          value={code}
          onChange={val => setCode(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
          }}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleRun} disabled={loading}>
          {loading ? 'Выполняется...' : 'Запустить'}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Сбросить
        </Button>
      </div>

      <ResultDisplay result={result} loading={loading} error={error} />
    </div>
  )
}
