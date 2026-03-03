/**
 * Единый компонент текста. Базовый размер 14px (text-sm).
 * variant: 'body' | 'muted' | 'error' | 'mono'
 */
const variantStyles = {
  body: 'text-sm text-slate-700 leading-relaxed',
  muted: 'text-sm text-slate-500',
  mutedLight: 'text-sm text-slate-400',
  error: 'text-sm text-red-600',
  mono: 'text-sm font-mono text-slate-700',
}

export default function Text({ as: Tag = 'p', variant = 'body', className = '', children, ...props }) {
  const styles = variantStyles[variant] || variantStyles.body
  return (
    <Tag className={`${styles} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  )
}
