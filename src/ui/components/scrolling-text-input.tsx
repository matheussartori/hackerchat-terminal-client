import { Text, useInput } from 'ink'
import chalk from 'chalk'
import { useEffect, useState } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  width: number
  focus?: boolean
  maxLength?: number
}

export function ScrollingTextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  width,
  focus = true,
  maxLength,
}: Props) {
  const [cursorOffset, setCursorOffset] = useState(value.length)

  useEffect(() => {
    if (cursorOffset > value.length) setCursorOffset(value.length)
  }, [value, cursorOffset])

  useInput((input, key) => {
    if (!focus) return
    if (
      key.upArrow ||
      key.downArrow ||
      (key.ctrl && input === 'c') ||
      key.tab ||
      (key.shift && key.tab)
    ) {
      return
    }
    if (key.return) {
      onSubmit?.(value)
      return
    }
    if (key.leftArrow) {
      setCursorOffset(o => Math.max(0, o - 1))
      return
    }
    if (key.rightArrow) {
      setCursorOffset(o => Math.min(value.length, o + 1))
      return
    }
    if (key.backspace || key.delete) {
      if (cursorOffset > 0) {
        const next = value.slice(0, cursorOffset - 1) + value.slice(cursorOffset)
        onChange(next)
        setCursorOffset(o => Math.max(0, o - 1))
      }
      return
    }
    if (!input) return
    let toInsert = input
    if (maxLength !== undefined) {
      const remaining = maxLength - value.length
      if (remaining <= 0) return
      toInsert = input.slice(0, remaining)
    }
    const next = value.slice(0, cursorOffset) + toInsert + value.slice(cursorOffset)
    onChange(next)
    setCursorOffset(o => o + toInsert.length)
  }, { isActive: focus })

  const innerWidth = Math.max(1, width)

  if (value.length === 0) {
    if (!focus) {
      return <Text>{chalk.grey(placeholder.slice(0, innerWidth))}</Text>
    }
    if (placeholder.length > 0) {
      const head = chalk.inverse(placeholder[0])
      const tail = chalk.grey(placeholder.slice(1, innerWidth))
      return <Text>{head + tail}</Text>
    }
    return <Text>{chalk.inverse(' ')}</Text>
  }

  // Determine visible window so cursor stays in view.
  let start = 0
  if (cursorOffset >= innerWidth) {
    start = cursorOffset - innerWidth + 1
  }
  const end = start + innerWidth
  const visibleStart = start
  const visibleEnd = Math.min(value.length, end)

  let rendered = ''
  for (let i = visibleStart; i < visibleEnd; i++) {
    const ch = value[i]
    rendered += i === cursorOffset ? chalk.inverse(ch) : ch
  }
  if (focus && cursorOffset === value.length && cursorOffset >= visibleStart && cursorOffset < visibleStart + innerWidth) {
    rendered += chalk.inverse(' ')
  }

  return <Text>{rendered}</Text>
}
