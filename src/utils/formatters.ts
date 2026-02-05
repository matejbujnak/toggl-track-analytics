// Funkcie na formátovanie času a dátumov

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('sk-SK')
}
