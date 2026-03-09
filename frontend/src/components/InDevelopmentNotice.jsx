import { Heading, Text } from './ui'

export default function InDevelopmentNotice({ title = 'Находится в разработке', message }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <Heading as="h4" level="block" className="mb-1">
        {title}
      </Heading>
      <Text variant="muted">
        {message || 'Этот режим временно недоступен. Скоро здесь появится полноценный функционал.'}
      </Text>
    </div>
  )
}
