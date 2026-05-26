import { useEffect, useState } from 'react'

export function useClock(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return now
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 8)
}

export function formatShortTime(date: Date): string {
  return date.toTimeString().slice(0, 5)
}
