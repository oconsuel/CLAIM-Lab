import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Heading, Text, Button } from './ui'

export default function ResultDisplay({ result, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-800" />
        <Text variant="muted" className="ml-3">Выполняется...</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
        <Text variant="error">{error}</Text>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="space-y-6 mt-6">
      {(result.metric != null || result.message) && (
        <div className="flex items-baseline gap-3">
          {typeof result.metric === 'number' && (
            <span className="text-3xl font-bold text-slate-800">
              {`${(result.metric * 100).toFixed(1)}%`}
            </span>
          )}
          {result.message && <Text variant="muted">{result.message}</Text>}
        </div>
      )}

      {result.train_size != null && result.test_size != null && (
        <TrainTestSplit
          trainSize={result.train_size}
          testSize={result.test_size}
          totalSamples={result.total_samples}
        />
      )}

      {result.stdout && (
        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
          {result.stdout}
        </pre>
      )}

      {result.confusion_matrix && result.confusion_matrix.length === 2 && (
        <ConfusionMatrix
          matrix={result.confusion_matrix}
          errorsCount={result.errors_count}
          labels={result.confusion_labels}
        />
      )}

      {result.examples_incorrect?.length > 0 && (
        <ExamplesBlock
          title="Где модель ошибается"
          examples={result.examples_incorrect}
          variant="error"
        />
      )}
      {result.examples_correct?.length > 0 && (
        <ExamplesBlock
          title="Правильные предсказания"
          examples={result.examples_correct}
          variant="success"
        />
      )}

      {result.model_insights && <ModelInsights insights={result.model_insights} />}

      {result.word_highlights?.length > 0 && (
        <WordHighlights highlights={result.word_highlights} />
      )}

      {result.test_images?.length > 0 && <TestImages images={result.test_images} />}

      {result.neighbors && <NeighborsView data={result.neighbors} />}

      {result.forward_steps?.length > 0 && (
        <ForwardProcessStrip steps={result.forward_steps} />
      )}

      {result.generation_steps?.length > 0 && (
        <GenerationSteps
          steps={result.generation_steps}
          trainingExamples={result.generation_training_examples}
          digit={result.generation_digit}
          targetPixels={result.generation_target_pixels}
        />
      )}

      {result.original_images && result.reconstructed_images && (
        <ReconstructionView
          originals={result.original_images}
          reconstructed={result.reconstructed_images}
        />
      )}

      {result.recommendation_explanations?.length > 0 && (
        <RecommendationExplanations explanations={result.recommendation_explanations} />
      )}

      {result.mode && result.recognition && (
        <TrickTheAIView result={result} />
      )}

      {result.chartData && (
        <div>
          <ChartView chartData={result.chartData} />
          {result.explanation_text && (
            <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 rounded p-3">
              {result.explanation_text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function TrainTestSplit({ trainSize, testSize, totalSamples }) {
  const trainPct = Math.round((trainSize / (trainSize + testSize)) * 100)
  const testPct = 100 - trainPct

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="block" className="mb-2">
        Разбиение данных
      </Heading>
      <div className="flex rounded-full overflow-hidden h-5 bg-slate-200">
        <div
          className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
          style={{ width: `${trainPct}%` }}
        >
          {trainPct}%
        </div>
        <div
          className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
          style={{ width: `${testPct}%` }}
        >
          {testPct}%
        </div>
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-slate-500">
        <span>Обучение: {trainSize} {totalSamples ? `из ${totalSamples}` : ''}</span>
        <span>Тестирование: {testSize}</span>
      </div>
    </div>
  )
}

function ConfusionMatrix({ matrix, errorsCount, labels }) {
  if (!matrix || matrix.length !== 2) return null
  const [[tn, fp], [fn, tp]] = matrix

  const label0 = labels?.[0] || 'класс 0'
  const label1 = labels?.[1] || 'класс 1'

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="section">
        Матрица ошибок
        {errorsCount != null && (
          <span className="ml-2 text-slate-400 normal-case font-normal">
            ({errorsCount} {errorsCount === 1 ? 'ошибка' : errorsCount < 5 ? 'ошибки' : 'ошибок'})
          </span>
        )}
      </Heading>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-0 max-w-sm text-sm">
        <div />
        <div className="text-center py-2 px-3 text-xs font-medium text-slate-500 border-b border-slate-200">
          Предсказано: {label0}
        </div>
        <div className="text-center py-2 px-3 text-xs font-medium text-slate-500 border-b border-slate-200">
          Предсказано: {label1}
        </div>

        <div className="flex items-center py-2 px-3 text-xs font-medium text-slate-500 border-r border-slate-200">
          Реально: {label0}
        </div>
        <div className="text-center py-3 px-3 bg-green-50 text-green-800 font-semibold border-r border-b border-slate-100">
          {tn}
          <div className="text-xs font-normal text-green-600 mt-0.5">верно {label0}</div>
        </div>
        <div className="text-center py-3 px-3 bg-red-50 text-red-800 font-semibold border-b border-slate-100">
          {fp}
          <div className="text-xs font-normal text-red-600 mt-0.5">ложный {label1}</div>
        </div>

        <div className="flex items-center py-2 px-3 text-xs font-medium text-slate-500 border-r border-slate-200">
          Реально: {label1}
        </div>
        <div className="text-center py-3 px-3 bg-red-50 text-red-800 font-semibold border-r border-slate-100">
          {fn}
          <div className="text-xs font-normal text-red-600 mt-0.5">пропущенный {label1}</div>
        </div>
        <div className="text-center py-3 px-3 bg-green-50 text-green-800 font-semibold">
          {tp}
          <div className="text-xs font-normal text-green-600 mt-0.5">верно {label1}</div>
        </div>
      </div>
    </div>
  )
}

function ExamplesBlock({ title, examples, variant }) {
  const borderColor = variant === 'error' ? 'border-red-200' : 'border-green-200'
  const bgColor = variant === 'error' ? 'bg-red-50' : 'bg-green-50'
  const headerColor = variant === 'error' ? 'text-red-700' : 'text-green-700'

  return (
    <div className={`rounded-lg border ${borderColor} overflow-hidden`}>
      <div className={`${bgColor} px-4 py-2`}>
        <Heading as="h4" level="block" className={`!mb-0 ${headerColor}`}>{title}</Heading>
      </div>
      <div className="divide-y divide-slate-100">
        {examples.map((ex, i) => (
          <div key={i} className="px-4 py-3 flex flex-col gap-1">
            <p className="text-sm text-slate-700">&ldquo;{ex.text}&rdquo;</p>
            <div className="flex gap-4 text-xs">
              <span className="text-slate-500">
                Истинный: <span className="font-medium text-slate-700">{ex.true_label}</span>
              </span>
              <span className="text-slate-500">
                Предсказан: <span className={`font-medium ${ex.true_label !== ex.predicted_label ? 'text-red-600' : 'text-green-600'}`}>
                  {ex.predicted_label}
                </span>
              </span>
              {ex.probability != null && (
                <span className="text-slate-500">
                  Уверенность: <span className="font-mono font-medium text-slate-700">{(ex.probability * 100).toFixed(0)}%</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ModelInsights({ insights }) {
  if (!insights) return null
  const { top_positive_features, top_negative_features } = insights
  if (!top_positive_features?.length && !top_negative_features?.length) return null

  const posLabel = insights.positive_label || 'класс 1'
  const negLabel = insights.negative_label || 'класс 0'

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="section">
        Какие слова важны для модели
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {top_positive_features?.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-red-600 mb-2">Признаки «{posLabel}»</h5>
            <div className="space-y-1">
              {top_positive_features.map((f, i) => (
                <FeatureBar key={i} feature={f.feature} weight={f.weight} color="red" maxWeight={top_positive_features[0]?.weight} />
              ))}
            </div>
          </div>
        )}
        {top_negative_features?.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-blue-600 mb-2">Признаки «{negLabel}»</h5>
            <div className="space-y-1">
              {top_negative_features.map((f, i) => (
                <FeatureBar key={i} feature={f.feature} weight={f.weight} color="blue" maxWeight={top_negative_features[0]?.weight} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FeatureBar({ feature, weight, color, maxWeight }) {
  const absWeight = Math.abs(weight)
  const absMax = Math.abs(maxWeight) || 1
  const pct = Math.min(100, (absWeight / absMax) * 100)
  const barColor = color === 'red' ? 'bg-red-400' : 'bg-blue-400'

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-right font-mono text-slate-600 truncate" title={feature}>{feature}</span>
      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div className={`${barColor} h-full rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-mono text-slate-500">{weight.toFixed(3)}</span>
    </div>
  )
}

function WordHighlights({ highlights }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="block">
        Вклад слов в предсказание
      </Heading>
      <p className="text-xs text-slate-400 mb-3">Красный = в сторону положительного, синий = в сторону отрицательного</p>
      <div className="space-y-3">
        {highlights.map((item, i) => (
          <div key={i} className="bg-white rounded p-3 border border-slate-100">
            <div className="flex gap-2 text-xs text-slate-500 mb-2">
              <span>Истинный: <span className="font-medium text-slate-700">{item.true_label}</span></span>
              <span>Предсказан: <span className="font-medium text-slate-700">{item.predicted_label}</span></span>
            </div>
            <p className="text-sm leading-relaxed">
              {item.words?.map((w, j) => (
                <span
                  key={j}
                  className="inline-block mr-1"
                  style={{
                    backgroundColor: w.weight > 0
                      ? `rgba(239, 68, 68, ${Math.min(Math.abs(w.weight) * 3, 0.6)})`
                      : w.weight < 0
                        ? `rgba(59, 130, 246, ${Math.min(Math.abs(w.weight) * 3, 0.6)})`
                        : 'transparent',
                    padding: '1px 3px',
                    borderRadius: '3px',
                  }}
                >
                  {w.text}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TestImages({ images }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="block">
        Тестовые изображения
      </Heading>
      <p className="text-xs text-slate-400 mb-3">Красная рамка = модель ошиблась</p>
      <div className="flex gap-4 flex-wrap">
        {images.map((img, i) => (
          <div key={i} className={`text-center p-2 rounded-lg border ${
            img.true_label !== img.predicted_label ? 'border-red-300 bg-red-50' : 'border-green-200 bg-white'
          }`}>
            <PixelGrid pixels={img.pixels} size={8} />
            <div className="mt-1 text-xs">
              <div className="text-slate-500">Истинная: <span className="font-semibold">{img.true_label}</span></div>
              <div className={img.true_label !== img.predicted_label ? 'text-red-600 font-semibold' : 'text-green-600'}>
                Предсказано: {img.predicted_label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PixelGrid({ pixels, size = 8, cellSize = 6, tooltipFn }) {
  const [tip, setTip] = useState(null)

  if (!pixels || pixels.length === 0) return null

  return (
    <div className="relative inline-block">
      <div
        className="inline-grid border border-slate-200"
        onMouseLeave={tooltipFn ? () => setTip(null) : undefined}
        style={{
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
        }}
      >
        {pixels.flat().map((val, i) => {
          const intensity = Math.round((1 - val / 16) * 255)
          return (
            <div
              key={i}
              onMouseEnter={tooltipFn ? () => {
                const row = Math.floor(i / size)
                const col = i % size
                setTip({ row, col, text: tooltipFn(i, val) })
              } : undefined}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: `rgb(${intensity},${intensity},${intensity})`,
                cursor: tooltipFn ? 'crosshair' : undefined,
              }}
            />
          )
        })}
      </div>
      {tip && (
        <div
          className="absolute z-50 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none leading-relaxed"
          style={{
            left: tip.col * cellSize,
            top: tip.row * cellSize - 6,
            transform: 'translateY(-100%)',
            minWidth: size * cellSize * 2,
            whiteSpace: 'pre-line',
          }}
        >
          {tip.text}
        </div>
      )}
    </div>
  )
}

function NeighborsView({ data }) {
  if (!data) return null

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="block">
        Как модель принимает решение
      </Heading>
      <p className="text-xs text-slate-400 mb-3">
        Модель сравнила тестовое изображение с {data.neighbors?.length || 0} ближайшими примерами из обучающей выборки
      </p>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Тестовый пример</div>
          <PixelGrid pixels={data.test_image} size={8} />
          <div className="text-xs font-semibold mt-1">Цифра {data.test_label}</div>
        </div>
        <div className="text-slate-400 text-xl">&rarr;</div>
        {data.neighbors?.map((n, i) => (
          <div key={i} className="text-center">
            <div className="text-xs text-slate-400 mb-1">Пример {i + 1}</div>
            <PixelGrid pixels={n.pixels} size={8} />
            <div className="text-xs mt-1">Цифра {n.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReconstructionView({ originals, reconstructed }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="section">
        Оригинал и восстановление
      </Heading>
      <div className="flex gap-6 flex-wrap">
        {originals.map((orig, i) => (
          <div key={i} className="text-center">
            <div className="flex gap-2 items-center">
              <div>
                <div className="text-xs text-slate-400 mb-1">Оригинал</div>
                <PixelGrid pixels={orig} size={8} />
              </div>
              <div className="text-slate-300">&rarr;</div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Восстановлено</div>
                <PixelGrid pixels={reconstructed[i]} size={8} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationExplanations({ explanations }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="block">
        Почему модель рекомендует
      </Heading>
      <p className="text-xs text-slate-400 mb-3">Рекомендации основаны на оценках похожих пользователей</p>
      <div className="space-y-2">
        {explanations.map((exp, i) => (
          <div key={i} className="bg-white rounded p-3 border border-slate-100 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-700">{exp.item}</span>
              <span className="text-xs text-slate-400">предсказанная оценка: {exp.predicted_rating}</span>
            </div>
            <div className="text-xs text-slate-500">{exp.reason}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ForwardProcessStrip({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <Heading as="h4" level="block">
        Прямой процесс: как шум разрушает изображение
      </Heading>
      <Text variant="mutedLight" className="mb-3">
        Модель учится обращать этот процесс — из шума восстанавливать изображение
      </Text>
      <div className="flex gap-2 items-start overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={i} className="text-center shrink-0 flex flex-col items-center">
            <PixelGrid pixels={s.pixels} size={8} cellSize={6} />
            <div className="text-xs text-slate-400 mt-1 min-h-[2.5rem] flex items-center justify-center text-center leading-tight" style={{ width: 52 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrainingExamplesStrip({ examples, digit }) {
  const containerRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(7)
  const itemW = 60

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.offsetWidth || 0
      setVisibleCount(Math.min(10, Math.max(3, Math.floor(w / itemW))))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const visible = examples.slice(0, visibleCount)
  return (
    <div ref={containerRef} className="mt-auto pt-4 border-t border-slate-100">
      <div className="text-xs text-slate-500 mb-2">
        Примеры цифры <span className="font-semibold">«{digit}»</span> из набора данных (для сравнения)
      </div>
      <div className="flex gap-3 flex-nowrap overflow-hidden">
        {visible.map((ex, i) => (
          <PixelGrid key={i} pixels={ex} size={8} cellSize={6} />
        ))}
      </div>
    </div>
  )
}

function _brightnessLabel(v) {
  if (v > 10) return 'тёмный (похоже на линию)'
  if (v > 5) return 'средний'
  if (v > 1) return 'светлый'
  return 'почти белый (похоже на фон)'
}

function _mainTip() {
  return (i, val) => {
    const row = Math.floor(i / 8) + 1
    const col = (i % 8) + 1
    const v = Math.round(val * 10) / 10
    const label = _brightnessLabel(val)
    return `Пиксель [${row}, ${col}]\nЯркость: ${v} из 16 — ${label}\n\nВ настоящих диффузионных моделях (Stable Diffusion и др.) цель неизвестна. Модель не вычисляет сразу, каким будет каждый пиксель. Она обучена предсказывать шум и убирает его небольшими шагами — поэтому процесс идёт постепенно.`
  }
}

function _diffTip() {
  return (i, diffVal) => {
    const row = Math.floor(i / 8) + 1
    const col = (i % 8) + 1
    const dv = Math.round(diffVal * 10) / 10
    let change, why
    if (Math.abs(dv) < 0.5) {
      change = 'почти без изменений'
      why = 'Значение уже достаточно точное, модель почти не трогает этот пиксель.'
    } else if (dv > 0) {
      change = `стал темнее на ${dv}`
      why = `Модель на этом шаге решила затемнить пиксель. Она вносит небольшие исправления, а не меняет всё сразу — так надёжнее и соответствует принципу диффузии.`
    } else {
      change = `стал светлее на ${Math.abs(dv)}`
      why = `Модель на этом шаге осветлила пиксель. Каждый шаг — лишь небольшая правка. Так работают диффузионные модели: они не знают конечный результат и предсказывают изменения понемногу.`
    }
    return `Пиксель [${row}, ${col}]\nНа этом шаге: ${change} (красный = темнее, синий = светлее)\n\n${why}`
  }
}

function _nnTip(mainFlat) {
  return (i, val) => {
    const row = Math.floor(i / 8) + 1, col = (i % 8) + 1
    const v = Math.round(val * 10) / 10
    const cv = Math.round(mainFlat[i] * 10) / 10
    const diff = Math.round((cv - v) * 10) / 10
    let cmp
    if (Math.abs(diff) < 1) cmp = 'Наш пиксель почти совпадает'
    else if (diff > 0) cmp = `Наш темнее на ${diff}`
    else cmp = `Наш светлее на ${Math.abs(diff)}`
    return `Пиксель [${row}, ${col}]\nВ ближайшем примере: ${v}\nУ нас сейчас: ${cv}\n${cmp}`
  }
}

function GenerationSteps({ steps, trainingExamples, digit, targetPixels }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => { setCurrent(0) }, [steps])

  if (!steps || steps.length === 0) return null
  const step = steps[current]
  const isFirst = current === 0
  const isLast = current === steps.length - 1
  const progressPct = Math.round(((current) / (steps.length - 1)) * 100)

  const mainFlat = step.pixels?.flat()
  const mainTip = _mainTip()
  const diffTip = _diffTip()
  const nnTip = mainFlat ? _nnTip(mainFlat) : undefined

  return (
    <div className="bg-slate-50 rounded-lg p-5">
      <Heading as="h4" level="block">
        Генерация по шагам
      </Heading>
      <p className="text-xs text-slate-400 mb-4">
        Листайте шаги, чтобы увидеть, как модель постепенно создаёт изображение
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium">Шаг {current + 1} из {steps.length}</span>
          <span>{step.label}</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-700 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5 mb-4">
        <div className="md:w-1/2 flex flex-col gap-3 items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <PixelGrid pixels={step.pixels} size={8} cellSize={20} tooltipFn={mainTip} />
            </div>
            {step.quality_pct != null && (
              <div className="w-[176px]">
                <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                  <span>Распознано</span>
                  <span className="font-mono font-medium text-slate-600">{step.quality_pct}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${step.recognized_as === digit ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.max(step.quality_pct, 2)}%` }}
                  />
                </div>
              </div>
            )}
            {step.quality_pct == null && step.mse > 0 && (
              <div className="text-xs text-slate-400">
                {step.mse_label || 'Ошибка'}: <span className="font-mono font-medium text-slate-600">{step.mse}</span>
              </div>
            )}
            {step.quality_pct == null && step.mse === 0 && current === steps.length - 1 && (
              <div className="text-xs text-green-600 font-medium">Точная копия</div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            {step.diff_pixels ? (
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Что изменилось</div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <DiffPixelGrid pixels={step.diff_pixels} size={8} cellSize={20} tooltipFn={diffTip} />
                </div>
              </div>
            ) : (
              <div className="text-center opacity-30">
                <div className="text-xs text-slate-400 mb-1">Что изменилось</div>
                <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-center" style={{ width: 160, height: 160 }}>
                  <span className="text-xs text-slate-300">первый шаг</span>
                </div>
              </div>
            )}
            {step.nn_pixels && (
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Ближайший в базе</div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <PixelGrid pixels={step.nn_pixels} size={8} cellSize={20} tooltipFn={nnTip} />
                </div>
                {step.nn_label != null && (
                  <div className="text-xs text-slate-500 mt-0.5">цифра «{step.nn_label}»</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col min-h-0">
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex-1 flex flex-col gap-3 text-sm">
            <div>
              <div className="font-bold text-slate-800">
                {step.phase_title || step.label}
              </div>
              {step.phase_description && (
                <p className="text-slate-600 leading-relaxed mt-1">
                  {step.phase_description}
                </p>
              )}
            </div>

            {step.pixels_changed != null && (
              <div className="leading-relaxed">
                <span className="font-medium text-slate-500">Изменилось с прошлого шага: </span>
                <span className="font-medium text-slate-500">{step.pixels_changed} из {step.pixels_total || 64} пикселей.</span>
                {' '}<span className="text-slate-400">Наведите на любой пиксель изображения, чтобы узнать подробности.</span>
              </div>
            )}

            {step.recognized_as != null && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div>
                  <span className="font-medium text-slate-500">Распознаватель видит: </span>
                  <span className={`font-semibold ${step.recognized_as === digit ? 'text-emerald-600' : 'text-amber-600'}`}>
                    цифру «{step.recognized_as}»
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Уверенность в «{digit}»: </span>
                  <span className="font-mono font-bold text-slate-800">{step.quality_pct}%</span>
                </div>
              </div>
            )}

            {!step.phase_title && step.description && (
              <p className="text-slate-600 leading-relaxed">{step.description}</p>
            )}

            {trainingExamples?.length > 0 && (
              <TrainingExamplesStrip examples={trainingExamples} digit={digit} />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setCurrent(s => Math.max(0, s - 1))}
            disabled={isFirst}
          >
            &larr; Назад
          </Button>
          <span className="text-sm text-slate-400 tabular-nums w-12 text-center">
            {current + 1}/{steps.length}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrent(s => Math.min(steps.length - 1, s + 1))}
            disabled={isLast}
          >
            Вперёд &rarr;
          </Button>
        </div>

        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                i === current ? 'bg-slate-800' : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DiffPixelGrid({ pixels, size = 8, cellSize = 8, tooltipFn }) {
  const [tip, setTip] = useState(null)

  if (!pixels || pixels.length === 0) return null
  const flat = pixels.flat()
  const maxAbs = Math.max(...flat.map(Math.abs), 0.01)

  return (
    <div className="relative inline-block">
      <div
        className="inline-grid"
        onMouseLeave={tooltipFn ? () => setTip(null) : undefined}
        style={{
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
        }}
      >
        {flat.map((val, i) => {
          const norm = val / maxAbs
          const r = norm > 0 ? Math.round(norm * 200) : 0
          const b = norm < 0 ? Math.round(-norm * 200) : 0
          const g = 0
          const a = Math.min(Math.abs(norm), 1)
          return (
            <div
              key={i}
              onMouseEnter={tooltipFn ? () => {
                const row = Math.floor(i / size)
                const col = i % size
                setTip({ row, col, text: tooltipFn(i, val) })
              } : undefined}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: `rgba(${r},${g},${b},${Math.max(a, 0.05)})`,
                cursor: tooltipFn ? 'crosshair' : undefined,
              }}
            />
          )
        })}
      </div>
      {tip && (
        <div
          className="absolute z-50 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none leading-relaxed"
          style={{
            left: tip.col * cellSize,
            top: tip.row * cellSize - 6,
            transform: 'translateY(-100%)',
            minWidth: size * cellSize * 2,
            whiteSpace: 'pre-line',
          }}
        >
          {tip.text}
        </div>
      )}
    </div>
  )
}

function ChartView({ chartData }) {
  if (!chartData || !chartData.data || chartData.data.length === 0) return null

  const ChartComponent = chartData.type === 'line' ? LineChart : BarChart
  const DataComponent = chartData.type === 'line' ? Line : Bar

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <ResponsiveContainer width="100%" height={250}>
        <ChartComponent data={chartData.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={chartData.xKey || 'name'} tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 1]} />
          <Tooltip
            contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}
            formatter={(val) => [`${(val * 100).toFixed(1)}%`, chartData.label || 'Точность']}
          />
          <DataComponent
            dataKey={chartData.yKey || 'value'}
            fill="#475569"
            stroke="#475569"
            strokeWidth={2}
            radius={chartData.type === 'line' ? undefined : [4, 4, 0, 0]}
            dot={chartData.type === 'line' ? { r: 3 } : undefined}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}


function TrickTheAIView({ result }) {
  const rec = result.recognition || {}
  const top5 = rec.top5 || []
  const xai = result.xai || null
  const [hoveredCell, setHoveredCell] = useState(null)
  const formatClassScore = (score) => {
    const num = Number(score ?? 0)
    if (!Number.isFinite(num)) return '0%'
    return num < 1 ? `${num.toFixed(2)}%` : `${Math.round(num)}%`
  }
  const img = result.image_b64
    ? (String(result.image_b64).startsWith('data:') ? result.image_b64 : `data:image/jpeg;base64,${result.image_b64}`)
    : null
  const xaiImg = xai?.overlay_b64
    ? (String(xai.overlay_b64).startsWith('data:') ? xai.overlay_b64 : `data:image/jpeg;base64,${xai.overlay_b64}`)
    : null

  const [tooltipRect, setTooltipRect] = useState(null)
  const canvasTopRef = useRef(null)
  const canvasBottomRef = useRef(null)
  const [canvasH, setCanvasH] = useState(320)
  const xaiContainerRef = useRef(null)
  const xaiImgRef = useRef(null)
  const [imgRect, setImgRect] = useState(null)

  const measureCanvas = () => {
    const topEl = canvasTopRef.current
    const botEl = canvasBottomRef.current
    if (!topEl || !botEl) return
    const t = topEl.getBoundingClientRect().bottom
    const b = botEl.getBoundingClientRect().bottom
    const h = Math.max(200, Math.round(b - t))
    setCanvasH(h)
  }

  const measureImgRect = () => {
    const imgEl = xaiImgRef.current
    const containerEl = xaiContainerRef.current
    if (!imgEl || !containerEl) return
    const cRect = containerEl.getBoundingClientRect()
    const natW = imgEl.naturalWidth || 1
    const natH = imgEl.naturalHeight || 1
    const scale = Math.min(cRect.width / natW, cRect.height / natH)
    const rw = natW * scale
    const rh = natH * scale
    const rx = (cRect.width - rw) / 2
    const ry = (cRect.height - rh) / 2
    setImgRect({ left: rx, top: ry, width: rw, height: rh })
  }

  useEffect(() => {
    measureCanvas()
    const ro = new ResizeObserver(() => { measureCanvas(); measureImgRect() })
    if (canvasTopRef.current) ro.observe(canvasTopRef.current)
    if (canvasBottomRef.current) ro.observe(canvasBottomRef.current)
    if (xaiContainerRef.current) ro.observe(xaiContainerRef.current)
    return () => ro.disconnect()
  }, [rec, xai])

  const handleCellEnter = (cell, ev) => {
    setHoveredCell(cell)
    setTooltipRect({ left: ev.clientX, top: ev.clientY })
  }

  const handleCellLeave = () => {
    setHoveredCell(null)
    setTooltipRect(null)
  }

  return (
    <div
      className="bg-slate-50 rounded-lg p-4 border border-slate-200"
      onMouseLeave={() => { setHoveredCell(null); setTooltipRect(null) }}
    >
      <Heading as="h4" level="block" className="mb-2">
        Результат распознавания
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {xaiImg ? (
            <div>
              <Text variant="body" className="font-medium text-slate-600 mb-8">
              </Text>
              <div
                ref={xaiContainerRef}
                className="rounded-md overflow-hidden relative"
                style={{ height: canvasH }}
              >
                <img
                  ref={xaiImgRef}
                  src={xaiImg}
                  alt="xai-overlay"
                  className="w-full h-full object-contain opacity-65"
                  onLoad={measureImgRect}
                />
                {!!xai?.grid && Array.isArray(xai?.cells) && xai.cells.length > 0 && imgRect && (
                  <div
                    className="absolute grid"
                    style={{
                      left: imgRect.left,
                      top: imgRect.top,
                      width: imgRect.width,
                      height: imgRect.height,
                      gridTemplateColumns: `repeat(${xai.grid}, minmax(0, 1fr))`,
                    }}
                  >
                    {xai.cells.map((cell) => {
                      const alpha = Math.min(0.65, Math.max(0.08, Number(cell.impact_norm || 0) * 0.65))
                      return (
                        <div
                          key={`${cell.gx}-${cell.gy}`}
                          className="relative"
                          onMouseEnter={(e) => handleCellEnter(cell, e)}
                          onMouseLeave={handleCellLeave}
                        >
                          <button
                            type="button"
                            className="w-full h-full border border-white/70 cursor-help"
                            style={{ backgroundColor: `rgba(220, 38, 38, ${alpha})` }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            img ? (
              <div className="w-[200px] h-[200px] bg-white border border-slate-200 rounded-md overflow-hidden shrink-0">
                <img src={img} alt="uploaded" className="w-full h-full object-contain" />
              </div>
            ) : (
              <Text variant="mutedLight">Изображение отсутствует</Text>
            )
          )}
        </div>
        <div className="space-y-2">
          <Text variant="body">
            <span className="font-medium text-slate-600">Топ-1: </span>
            <span className="font-semibold text-slate-800">{rec.top1_label || 'unknown'}</span>
            {' '}({formatClassScore(rec.top1_score ?? 0)})
          </Text>
          {rec.top1_label_en && (
            <Text variant="muted" className="text-xs">
              Оригинальная метка модели: {rec.top1_label_en}
            </Text>
          )}
          <div ref={canvasTopRef} />
          {top5.length > 0 && (
            <div className="space-y-1">
              {top5.map((row, i) => (
                <div key={`${row.label}-${i}`} className="py-1 border-b border-slate-100 last:border-b-0">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span className="relative group inline-flex pb-1">
                      {`${i + 1}. `}
                      {row.wiki_url ? (
                        <a
                          href={row.wiki_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          {row.label}
                        </a>
                      ) : (
                        <span>{row.label}</span>
                      )}

                      {row.wiki_url && (row.wiki_extract || row.wiki_image) && (
                        <div className="absolute left-0 top-full z-20 hidden group-hover:block w-[520px] bg-white border border-slate-200 rounded-lg shadow-xl p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800 mb-1">
                                {row.label}
                              </div>
                              {row.label_en && row.label_en !== row.label && (
                                <div className="text-xs text-slate-500 mb-1">
                                  {row.label_en}
                                </div>
                              )}
                              {row.wiki_extract && (
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {row.wiki_extract}
                                </p>
                              )}
                            </div>
                            {row.wiki_image && (
                              <div className="w-40 h-40 rounded border border-slate-200 overflow-hidden bg-slate-50 shrink-0 self-center">
                                <img src={row.wiki_image} alt={row.label} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <a
                              href={row.wiki_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block text-xs px-2.5 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-700"
                            >
                              Посмотреть на Wiki
                            </a>
                          </div>
                        </div>
                      )}
                    </span>
                    <span className="font-mono">{formatClassScore(row.score)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {xai?.note && (
            <Text variant="body" className="text-sm text-slate-700 leading-relaxed mt-6">
              {xai.note}
            </Text>
          )}
          <div ref={canvasBottomRef} />
        </div>
      </div>
      {hoveredCell?.reason && tooltipRect && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] min-w-[360px] max-w-[420px] p-3 bg-white border border-slate-200 rounded-lg shadow-xl text-sm text-slate-700 leading-relaxed pointer-events-none"
          style={{
            left: tooltipRect.left,
            top: tooltipRect.top,
          }}
        >
          {hoveredCell.reason}
        </div>,
        document.body
      )}
    </div>
  )
}
