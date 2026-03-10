import { useState, useMemo } from 'react'

const PORTRAITS = {
  'кот': [
    0,0,1,1,1,1,0,0,
    0,1,2,1,1,2,1,0,
    0,1,1,1,1,1,1,0,
    0,1,3,1,1,3,1,0,
    0,0,1,1,1,1,0,0,
    0,0,1,4,4,1,0,0,
    0,1,1,1,1,1,1,0,
    0,0,0,1,1,0,0,0,
  ],
  'собака': [
    1,1,0,0,0,0,1,1,
    1,1,0,0,0,0,1,1,
    0,0,2,2,2,2,0,0,
    0,0,2,3,3,2,0,0,
    0,0,2,2,2,2,0,0,
    0,0,0,4,4,0,0,0,
    0,1,1,2,2,1,1,0,
    0,0,0,2,2,0,0,0,
  ],
  'птица': [
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,1,1,2,1,1,1,0,
    0,1,1,1,1,1,1,0,
    0,0,3,3,3,3,0,0,
    0,0,0,4,4,0,0,0,
    0,0,1,1,1,1,0,0,
    0,0,1,0,0,1,0,0,
  ],
}

const PALETTES = {
  'кот':    ['#f0e6d8','#d4956a','#8b5e3c','#1a1a1a','#ff8fa0'],
  'собака': ['#f0e6d8','#c8a882','#8b6914','#1a1a1a','#ff8fa0'],
  'птица':  ['#f0e6d8','#4a90d9','#2c5f8a','#f5a623','#ff4444'],
}

const SCENES = {
  'кот':    { emoji: '🐱', conf: [0.92, 0.05, 0.03], label: 'Кот' },
  'собака': { emoji: '🐶', conf: [0.04, 0.93, 0.03], label: 'Собака' },
  'птица':  { emoji: '🐦', conf: [0.03, 0.04, 0.93], label: 'Птица' },
}

const OBJS = [
  { emoji: '🐱', name: 'Кот' },
  { emoji: '🐶', name: 'Собака' },
  { emoji: '🐦', name: 'Птица' },
]

const FILTER_NAMES = [
  'горизонтальные края', 'вертикальные края', 'диагональные края',
  'пятна и текстуры', 'общий контур', 'все переходы',
]

const MODEL_COLORS = { cnn: '#ff7043', vit: '#00c896', yolo: '#4f8ef7' }

const MODEL_INFO = {
  cnn: {
    fullName: 'CNN — Свёрточная нейросеть',
    year: '2012',
    desc: 'Классический подход к распознаванию изображений. Скользящие фильтры-«лупы» ищут паттерны: сначала простые (линии, углы), потом сложные (глаза, уши, морды).',
    useCase: 'Классификация изображений, медицинская диагностика',
    speed: 'Средняя',
    example: 'ResNet, VGG, EfficientNet',
  },
  vit: {
    fullName: 'ViT — Vision Transformer',
    year: '2020',
    desc: 'Современная архитектура, заимствованная из обработки текста. Разрезает фото на кусочки-«токены» и анализирует связи между ними через механизм внимания.',
    useCase: 'Классификация, генерация изображений',
    speed: 'Средняя',
    example: 'ViT, DeiT, Swin Transformer',
    highlight: 'Используется в нашей практике',
  },
  yolo: {
    fullName: 'YOLO — You Only Look Once',
    year: '2016',
    desc: 'Архитектура для обнаружения объектов в реальном времени. За один проход сети определяет и класс объекта, и его положение на изображении.',
    useCase: 'Видеонаблюдение, автопилот, робототехника',
    speed: 'Очень быстрая (<5 мс)',
    example: 'YOLOv5, YOLOv8, YOLOv11',
  },
}

function Portrait({ scene, size = 112 }) {
  const g = PORTRAITS[scene], p = PALETTES[scene], n = 8, c = size / n
  const rects = []
  for (let r = 0; r < n; r++)
    for (let i = 0; i < n; i++)
      rects.push(<rect key={`${r}-${i}`} x={i * c} y={r * c} width={c} height={c} fill={p[g[r * n + i]] || '#f0e6d8'} opacity={0.9} />)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 10, border: '2px solid #e0e0f0' }}>
      {rects}
    </svg>
  )
}

function EdgeMap({ scene, filterIdx, size = 80, color }) {
  const g = PORTRAITS[scene], n = 8, c = size / n
  const rects = []
  for (let r = 0; r < n - 1; r++)
    for (let i = 0; i < n - 1; i++) {
      const cur = g[r * n + i], right = g[r * n + i + 1], down = g[(r + 1) * n + i], diag = g[(r + 1) * n + i + 1]
      let intensity = 0
      if (filterIdx === 0) intensity = Math.abs(cur - down) > 0 ? 0.9 : 0.05
      else if (filterIdx === 1) intensity = Math.abs(cur - right) > 0 ? 0.9 : 0.05
      else if (filterIdx === 2) intensity = Math.abs(cur - diag) > 0 ? 0.85 : 0.05
      else if (filterIdx === 3) intensity = (cur > 0 && cur < 4) ? 0.8 : 0.05
      else if (filterIdx === 4) intensity = cur > 0 ? 0.7 : 0.05
      else intensity = Math.abs(cur - right) + Math.abs(cur - down) > 0 ? 0.8 : 0.05
      rects.push(<rect key={`${r}-${i}`} x={i * c} y={r * c} width={c + 1} height={c + 1} fill={color} opacity={Math.min(intensity, 1)} />)
    }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 10, background: '#1a1a2e', border: '2px solid #e0e0f0' }}>
      {rects}
    </svg>
  )
}

function AttentionVis({ scene, patchN, size = 160, color }) {
  const pSize = size / patchN
  const g = PORTRAITS[scene], pal = PALETTES[scene], n = 8, pixCell = size / n
  const fr = Math.floor(patchN / 2), fc = Math.floor(patchN / 2)
  const fx = fc * pSize + pSize / 2, fy = fr * pSize + pSize / 2
  const focusIdx = fr * patchN + fc

  const bgRects = []
  for (let r = 0; r < n; r++)
    for (let i = 0; i < n; i++)
      bgRects.push(<rect key={`bg-${r}-${i}`} x={i * pixCell} y={r * pixCell} width={pixCell} height={pixCell} fill={pal[g[r * n + i]] || '#f0e6d8'} opacity={0.5} />)

  const patches = [], arrows = []
  for (let pr = 0; pr < patchN; pr++)
    for (let pc = 0; pc < patchN; pc++) {
      const idx = pr * patchN + pc
      const isFocus = idx === focusIdx
      const dist = Math.sqrt((pr - fr) ** 2 + (pc - fc) ** 2)
      const weight = isFocus ? 1 : Math.max(0.1, 1 - dist / patchN)
      patches.push(
        <g key={`p-${pr}-${pc}`}>
          <rect x={pc * pSize} y={pr * pSize} width={pSize} height={pSize}
            fill={color} opacity={weight * 0.55}
            stroke={isFocus ? '#fff' : color} strokeWidth={isFocus ? 2.5 : 0.8} rx={3} />
          <text x={pc * pSize + pSize / 2} y={pr * pSize + pSize / 2 + 4} textAnchor="middle"
            fontSize={isFocus ? 11 : 9} fontWeight={isFocus ? 900 : 600} fill="white" opacity={isFocus ? 1 : 0.8}>
            {idx + 1}
          </text>
        </g>
      )
      if (!isFocus) {
        const tx = pc * pSize + pSize / 2, ty = pr * pSize + pSize / 2
        const dx = tx - fx, dy = ty - fy, len = Math.sqrt(dx * dx + dy * dy)
        const shorten = pSize * 0.45
        const ex = fx + dx * (1 - shorten / len), ey = fy + dy * (1 - shorten / len)
        const sx = fx + dx * (shorten / len * 0.8), sy = fy + dy * (shorten / len * 0.8)
        arrows.push(
          <line key={`a-${pr}-${pc}`} x1={sx} y1={sy} x2={ex} y2={ey}
            stroke={color} strokeWidth={(weight * 2 + 0.5).toFixed(1)} opacity={(weight * 0.9).toFixed(2)} markerEnd="url(#arr)" />
        )
      }
    }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 10, border: '2px solid #e0e0f0' }}>
      <defs>
        <marker id="arr" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <polygon points="0,0 5,2.5 0,5" fill={color} opacity={0.8} />
        </marker>
      </defs>
      {bgRects}
      {arrows}
      {patches}
    </svg>
  )
}

function YoloBoxes({ scene, gridN, showBest, size = 160, color }) {
  const g = PORTRAITS[scene], pal = PALETTES[scene], n = 8, pixC = size / n
  const sc2 = SCENES[scene]

  const bgRects = []
  for (let r = 0; r < n; r++)
    for (let i = 0; i < n; i++)
      bgRects.push(<rect key={`bg-${r}-${i}`} x={i * pixC} y={r * pixC} width={pixC} height={pixC} fill={pal[g[r * n + i]] || '#f0e6d8'} opacity={0.85} />)

  const boxes = []
  if (!showBest) {
    const gCell = size / gridN
    for (let gr = 0; gr < gridN; gr++)
      for (let gc = 0; gc < gridN; gc++) {
        const seed = gr * gridN + gc
        const cx = gc * gCell + gCell / 2, cy = gr * gCell + gCell / 2
        const bw = gCell * (0.8 + ((seed * 7) % 5) * 0.2)
        const bh = gCell * (0.8 + ((seed * 11) % 5) * 0.25)
        const conf = 0.1 + (seed % 9) * 0.1
        const opacity = 0.15 + conf * 0.5
        boxes.push(
          <g key={`b-${gr}-${gc}`}>
            <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} fill="none" stroke={color} strokeWidth={1.5} opacity={opacity} rx={2} />
            {conf > 0.4 && (
              <>
                <rect x={cx - bw / 2} y={cy - bh / 2 - 10} width={22} height={10} fill={color} opacity={opacity + 0.2} rx={2} />
                <text x={cx - bw / 2 + 11} y={cy - bh / 2 - 2} textAnchor="middle" fontSize={7} fill="white">{Math.round(conf * 100)}%</text>
              </>
            )}
          </g>
        )
      }
  } else {
    const bx = size * 0.12, by = size * 0.08, bw = size * 0.76, bh = size * 0.82
    boxes.push(
      <g key="best">
        <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke={color} strokeWidth={3} rx={6} />
        <rect x={bx} y={by - 18} width={72} height={18} fill={color} rx={4} />
        <text x={bx + 36} y={by - 4} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">{sc2.label} · 94%</text>
      </g>
    )
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 10, border: '2px solid #e0e0f0' }}>
      {bgRects}
      {boxes}
    </svg>
  )
}

function ResultBars({ scene, color }) {
  const sc2 = SCENES[scene]
  return (
    <div className="w-full">
      {sc2.conf.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5 mb-1.5 last:mb-0">
          <span className="text-sm shrink-0">{OBJS[i].emoji}</span>
          <span className="text-[10px] font-bold text-slate-500 min-w-[52px] shrink-0">{OBJS[i].name}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${v * 100}%`, background: color }} />
          </div>
          <span className="text-xs font-bold min-w-[34px] text-right" style={{ color }}>{Math.round(v * 100)}%</span>
        </div>
      ))}
    </div>
  )
}

function ModelInfoCard({ model, color }) {
  const info = MODEL_INFO[model]
  return (
    <div className="max-w-[1000px] mx-auto mb-4 rounded-2xl py-3.5 px-5 border-2 transition-all duration-300"
      style={{ borderColor: color + '40', background: color + '08' }}>
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base font-black" style={{ color }}>{info.fullName}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{info.year}</span>
            {info.highlight && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {info.highlight}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-2">{info.desc}</p>
          <div className="flex gap-4 flex-wrap">
            <div className="text-[11px]">
              <span className="text-slate-400 font-semibold">Применение: </span>
              <span className="text-slate-600">{info.useCase}</span>
            </div>
            <div className="text-[11px]">
              <span className="text-slate-400 font-semibold">Скорость: </span>
              <span className="text-slate-600 font-bold">{info.speed}</span>
            </div>
            <div className="text-[11px]">
              <span className="text-slate-400 font-semibold">Примеры: </span>
              <span className="text-slate-600">{info.example}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hint({ text, color }) {
  return (
    <div className="text-[11px] text-slate-600 mb-2 rounded-lg p-2" style={{ background: color + '15', borderLeft: `3px solid ${color}` }}>
      {text}
    </div>
  )
}

function Arrow({ color }) {
  return (
    <div className="flex items-center justify-center w-8 shrink-0 pt-2">
      <svg width="30" height="18" viewBox="0 0 30 18">
        <line x1="0" y1="9" x2="20" y2="9" stroke={color} strokeWidth={2.5} />
        <polygon points="18,3 30,9 18,15" fill={color} />
      </svg>
    </div>
  )
}

function Stage({ badge, title, vis, desc, color, delay, width = 210 }) {
  return (
    <div className="bg-white rounded-2xl p-4 shrink-0 shadow-md flex flex-col gap-2.5 animate-[popIn_0.35s_ease_both]"
      style={{ borderTop: `4px solid ${color}`, animationDelay: `${delay}s`, width }}>
      <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase text-white w-fit" style={{ background: color }}>
        {badge}
      </span>
      <div className="text-sm font-black text-slate-900 leading-tight">{title}</div>
      <div className="min-h-[110px] flex items-center justify-center">{vis}</div>
      <div className="text-[11.5px] text-slate-500 leading-relaxed">{desc}</div>
    </div>
  )
}

function useCnnStages(scene, filterCount, color) {
  return useMemo(() => {
    const sc2 = SCENES[scene]
    return [
      {
        badge: 'Шаг 1', title: 'Фото — это таблица чисел',
        vis: (
          <div className="text-center">
            <Portrait scene={scene} />
            <div className="text-[11px] text-slate-400 mt-1.5">каждый квадрат = число (цвет пикселя)</div>
          </div>
        ),
        desc: 'Компьютер не «видит» кота — он видит сетку чисел. Каждое число — яркость и цвет одного пикселя. 8×8 = 64 числа.',
      },
      {
        badge: 'Шаг 2', title: 'Лупы ищут разные детали',
        vis: (
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="relative inline-block">
              <Portrait scene={scene} size={100} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[35px] h-[35px] border-[3px] border-white rounded animate-pulse" style={{ boxShadow: `0 0 0 2px ${color}` }} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              {Array.from({ length: filterCount }, (_, f) => (
                <div key={f} className="flex items-center gap-2 bg-slate-50 rounded-lg py-1.5 px-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
                  <div className="text-xs text-slate-700"><b style={{ color }}>Лупа {f + 1}</b> ищет: {FILTER_NAMES[f % FILTER_NAMES.length]}</div>
                </div>
              ))}
            </div>
          </div>
        ),
        desc: 'Каждая лупа — маленькая сеточка 3×3. Она медленно проезжает по всему фото. В каждой позиции она спрашивает: «есть ли здесь то, что я ищу?»',
      },
      {
        badge: 'Шаг 3', title: 'Лупы «рисуют» что нашли',
        vis: (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex gap-2 flex-wrap justify-center">
              {Array.from({ length: filterCount }, (_, f) => (
                <div key={f} className="text-center">
                  <EdgeMap scene={scene} filterIdx={f} color={color} />
                  <div className="text-[10px] text-slate-500 font-bold mt-1">лупа {f + 1}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 text-center bg-slate-50 rounded-lg p-1.5">
              ярко = «нашла!» · темно = «ничего нет»
            </div>
          </div>
        ),
        desc: 'Каждая лупа создаёт свой «скетч» — как если бы художник обвёл только то, что его интересует.',
      },
      {
        badge: 'Ответ', title: `Это ${sc2.label}! ${sc2.emoji}`,
        vis: (
          <div className="w-full">
            <Hint text="💡 Скетчи → средняя яркость → числа → взвешенная сумма → %" color={color} />
            <ResultBars scene={scene} color={color} />
          </div>
        ),
        desc: 'Все скетчи «сворачиваются» в одно число каждый. Эти числа складываются с весами — и получаются вероятности.',
      },
    ]
  }, [scene, filterCount, color])
}

function useVitStages(scene, patchN, color) {
  return useMemo(() => {
    const sc2 = SCENES[scene], total = patchN * patchN
    const pCell = 112 / patchN
    const g = PORTRAITS[scene], pal = PALETTES[scene], n = 8, pixC = 112 / n
    const patchColors2 = ['#00c896', '#00b386', '#26d4a8', '#00e6b8', '#00a87a', '#33d4a0']

    const patchSvgRects = []
    for (let r = 0; r < n; r++)
      for (let i = 0; i < n; i++)
        patchSvgRects.push(<rect key={`bg-${r}-${i}`} x={i * pixC} y={r * pixC} width={pixC} height={pixC} fill={pal[g[r * n + i]] || '#f0e6d8'} opacity={0.85} />)
    const patchOverlays = []
    for (let pr = 0; pr < patchN; pr++)
      for (let pc = 0; pc < patchN; pc++) {
        const c2 = patchColors2[(pr * patchN + pc) % patchColors2.length]
        patchOverlays.push(
          <g key={`po-${pr}-${pc}`}>
            <rect x={pc * pCell} y={pr * pCell} width={pCell} height={pCell} fill={c2} opacity={0.22} rx={2} />
            <rect x={pc * pCell} y={pr * pCell} width={pCell} height={pCell} fill="none" stroke={c2} strokeWidth={1.8} />
            <text x={pc * pCell + pCell / 2} y={pr * pCell + pCell / 2 + 4} textAnchor="middle" fontSize={pCell > 20 ? 10 : 8} fontWeight="bold" fill={c2}>
              {pr * patchN + pc + 1}
            </text>
          </g>
        )
      }

    return [
      {
        badge: 'Шаг 1', title: 'Фото целиком',
        vis: (
          <div className="text-center">
            <Portrait scene={scene} />
            <div className="text-[11px] text-slate-400 mt-1.5">ViT берёт всё фото сразу</div>
          </div>
        ),
        desc: 'В отличие от CNN — никакого скользящего окна. ViT смотрит на фото целиком и сразу нарезает его на кусочки.',
      },
      {
        badge: 'Шаг 2', title: `Режем на ${total} кусочков`,
        vis: (
          <div className="text-center">
            <svg width={112} height={112} viewBox="0 0 112 112" style={{ borderRadius: 10, border: '2px solid #e0e0f0' }}>
              {patchSvgRects}
              {patchOverlays}
            </svg>
            <div className="text-[11px] text-slate-400 mt-1.5">{patchN}×{patchN} = {total} кусочков-токенов</div>
          </div>
        ),
        desc: `Фото нарезается на ${total} одинаковых квадратов. Каждый кусочек разворачивается в строчку чисел. Теперь у нас ${total} «слов» — как в предложении для текстового ИИ.`,
      },
      {
        badge: 'Шаг 3', title: 'Кусочки «переговариваются»',
        vis: (
          <div className="flex flex-col items-center gap-1.5">
            <AttentionVis scene={scene} patchN={patchN} color={color} />
            <div className="text-[11px] text-slate-500 text-center bg-green-50 rounded-lg p-1.5 w-full">
              толстая стрелка = «сильно интересует»<br />тонкая = «смотрю, но не важно»
            </div>
          </div>
        ),
        desc: 'Центральный кусочек смотрит на все остальные и спрашивает: «ты похож на то, что рядом со мной?» Стрелки показывают силу «внимания».',
      },
      {
        badge: 'Ответ', title: `Это ${sc2.label}! ${sc2.emoji}`,
        vis: (
          <div className="w-full">
            <Hint text="💡 Спец. кусочек [1] собрал всё → линейный слой → %" color={color} />
            <ResultBars scene={scene} color={color} />
          </div>
        ),
        desc: 'Первый кусочек [CLS] — специальный «сборщик». Он получил информацию от всех остальных через переговоры. Его итоговый вектор → финальный слой → вероятности.',
      },
    ]
  }, [scene, patchN, color])
}

function useYoloStages(scene, gridN, color) {
  return useMemo(() => {
    const sc2 = SCENES[scene]
    return [
      {
        badge: 'Шаг 1', title: 'Фото на входе',
        vis: (
          <div className="text-center">
            <Portrait scene={scene} />
            <div className="text-[11px] text-slate-400 mt-1.5">один проход — весь ответ</div>
          </div>
        ),
        desc: 'YOLO смотрит на фото целиком один раз. За этот один проход она одновременно определяет ЧТО изображено и ГДЕ находится.',
      },
      {
        badge: 'Шаг 2', title: `${gridN}×${gridN} клеток — каждая рисует рамку`,
        vis: (
          <div className="flex flex-col items-center gap-1.5">
            <YoloBoxes scene={scene} gridN={gridN} showBest={false} color={color} />
            <div className="text-[11px] text-slate-500 text-center bg-blue-50 rounded-lg p-1.5 w-full">
              каждая клетка рисует свою рамку<br />и называет уверенность
            </div>
          </div>
        ),
        desc: `Фото делится на ${gridN}×${gridN}=${gridN * gridN} клеток. Каждая клетка одновременно рисует рамку вокруг объекта который, как ей кажется, она видит. Получается хаос из ${gridN * gridN} рамок!`,
      },
      {
        badge: 'Шаг 3', title: 'Убираем все лишние рамки',
        width: 290,
        vis: (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-2.5 items-center">
              <div className="text-center">
                <YoloBoxes scene={scene} gridN={gridN} showBest={false} size={110} color={color} />
                <div className="text-[10px] text-red-500 font-bold mt-1">до NMS: хаос</div>
              </div>
              <span className="text-xl" style={{ color }}>→</span>
              <div className="text-center">
                <YoloBoxes scene={scene} gridN={gridN} showBest={true} size={110} color={color} />
                <div className="text-[10px] text-emerald-500 font-bold mt-1">после NMS: одна</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 bg-blue-50 rounded-lg p-1.5 w-full text-center">
              NMS оставляет только самую уверенную рамку
            </div>
          </div>
        ),
        desc: 'NMS (Non-Max Suppression) — фильтр здравого смысла. Смотрит на все рамки и оставляет только одну — с наибольшей уверенностью.',
      },
      {
        badge: 'Ответ', title: `${sc2.emoji} найден!`,
        vis: (
          <div className="w-full">
            <Hint text="📍 x, y, ширина, высота + класс + уверенность" color={color} />
            <ResultBars scene={scene} color={color} />
          </div>
        ),
        desc: 'Финальный ответ: ЧТО (класс + проценты) + ГДЕ (координаты рамки). Всё за один проход — меньше 5 мс на GPU. Поэтому YOLO используют в реальном времени.',
      },
    ]
  }, [scene, gridN, color])
}

export default function VisionModelsExplorer() {
  const [model, setModel] = useState('cnn')
  const [scene, setScene] = useState('кот')
  const [filterCount, setFilterCount] = useState(2)
  const [patchN, setPatchN] = useState(3)
  const [gridN, setGridN] = useState(5)

  const color = MODEL_COLORS[model]

  const cnnStages = useCnnStages(scene, filterCount, color)
  const vitStages = useVitStages(scene, patchN, color)
  const yoloStages = useYoloStages(scene, gridN, color)

  const stages = model === 'cnn' ? cnnStages : model === 'vit' ? vitStages : yoloStages

  const tabs = [
    { key: 'cnn', icon: '🔍', label: 'CNN' },
    { key: 'vit', icon: '🧩', label: 'ViT' },
    { key: 'yolo', icon: '🎯', label: 'YOLO' },
  ]

  const scenes = [
    { key: 'кот', icon: '🐱', label: 'Кот' },
    { key: 'собака', icon: '🐶', label: 'Собака' },
    { key: 'птица', icon: '🐦', label: 'Птица' },
  ]

  return (
    <div className="mt-6">
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.9) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

      <h3 className="text-center text-lg font-black text-slate-800 mb-1">Как компьютер видит картинки</h3>
      <p className="text-center text-xs text-slate-400 mb-5">Выбери модель и посмотри, что происходит внутри</p>

      <div className="flex justify-center gap-2.5 mb-5 flex-wrap">
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => setModel(t.key)}
            className="px-6 py-2 rounded-full text-sm font-bold border-2 transition-all cursor-pointer"
            style={{
              background: model === t.key ? MODEL_COLORS[t.key] : 'white',
              color: model === t.key ? 'white' : '#aaa',
              borderColor: model === t.key ? 'transparent' : '#e0e0f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <ModelInfoCard model={model} color={color} />

      <div className="max-w-[1000px] mx-auto mb-5 bg-white rounded-2xl py-3 px-5 shadow-sm border border-slate-100 flex items-center gap-4 flex-wrap">
        <label className="text-xs font-bold text-slate-500">Что на фото:</label>
        <select value={scene} onChange={e => setScene(e.target.value)}
          className="text-sm font-semibold border-2 border-slate-100 rounded-lg py-1.5 px-3 bg-slate-50 text-slate-700 cursor-pointer">
          {scenes.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
        </select>

        {model === 'cnn' && (
          <>
            <label className="text-xs font-bold text-slate-500">Сколько луп:</label>
            <input type="range" min={1} max={6} value={filterCount} onChange={e => setFilterCount(+e.target.value)}
              className="w-[110px] cursor-pointer" style={{ accentColor: color }} />
            <span className="text-sm font-black" style={{ color }}>{filterCount}</span>
          </>
        )}
        {model === 'vit' && (
          <>
            <label className="text-xs font-bold text-slate-500">Размер кусочков:</label>
            <input type="range" min={2} max={5} value={patchN} onChange={e => setPatchN(+e.target.value)}
              className="w-[110px] cursor-pointer" style={{ accentColor: color }} />
            <span className="text-sm font-black" style={{ color }}>{patchN}×{patchN} ({patchN * patchN} шт)</span>
          </>
        )}
        {model === 'yolo' && (
          <>
            <label className="text-xs font-bold text-slate-500">Размер сетки:</label>
            <input type="range" min={3} max={8} value={gridN} onChange={e => setGridN(+e.target.value)}
              className="w-[110px] cursor-pointer" style={{ accentColor: color }} />
            <span className="text-sm font-black" style={{ color }}>{gridN}×{gridN} = {gridN * gridN} рамок</span>
          </>
        )}
      </div>

      <div className="max-w-[1200px] mx-auto flex items-start gap-0 overflow-x-auto pb-3">
        {stages.map((s, i) => (
          <div key={`${model}-${i}`} className="flex items-center shrink-0">
            <Stage badge={s.badge} title={s.title} vis={s.vis} desc={s.desc} color={color} delay={i * 0.08} width={s.width} />
            {i < stages.length - 1 && <Arrow color={color} />}
          </div>
        ))}
      </div>
    </div>
  )
}
