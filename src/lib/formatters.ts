export const percent = (value: number) => `${value.toFixed(0)}%`

export const precisePercent = (value: number) => `${value.toFixed(1)}%`

export const formatRuntime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours.toString().padStart(2, '0')}h ${minutes
    .toString()
    .padStart(2, '0')}m`
}

export const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
