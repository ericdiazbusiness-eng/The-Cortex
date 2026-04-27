export const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const clampIndex = (length: number, value: number) => {
  if (length <= 0) {
    return 0
  }

  return ((value % length) + length) % length
}
