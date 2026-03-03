const API_BASE = '/api'

export async function runBeginner(practiceId, params) {
  const res = await fetch(`${API_BASE}/run-beginner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practice_id: practiceId, params }),
  })
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`)
  return res.json()
}

export async function runResearcher(practiceId, modelType, params) {
  const res = await fetch(`${API_BASE}/run-researcher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practice_id: practiceId, model_type: modelType, params }),
  })
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`)
  return res.json()
}

export async function fetchDatasetSamples(digit) {
  const res = await fetch(`${API_BASE}/practices/image-generation/dataset-samples?digit=${digit}`)
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`)
  return res.json()
}

export async function runEngineer(practiceId, code) {
  const res = await fetch(`${API_BASE}/run-engineer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practice_id: practiceId, code }),
  })
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`)
  return res.json()
}
