/**
 * Единый компонент заголовков.
 * level: 'page' | 'section' | 'block' | 'card' | 'pedagogy'
 * color: для pedagogy — 'blue' | 'amber' | 'violet' | 'slate' (default)
 */
const levelStyles = {
  page: 'text-2xl font-bold text-slate-800 mb-2',
  section: 'text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3',
  block: 'text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1',
  card: 'text-lg font-semibold text-slate-800 mb-2',
  pedagogy: 'uppercase tracking-wide mb-1',
}

const pedagogyColors = {
  blue: 'text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1',
  amber: 'text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2',
  violet: 'text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2',
  slate: 'text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2',
}

export default function Heading({ as: Tag = 'h2', level = 'section', color, className = '', children, ...props }) {
  let styles = levelStyles[level] || levelStyles.section
  if (level === 'pedagogy') {
    styles = pedagogyColors[color] || pedagogyColors.slate
  }
  return (
    <Tag className={`${styles} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  )
}
