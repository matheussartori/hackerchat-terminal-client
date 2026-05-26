import { Box, Text } from 'ink'
import type { ChatEntry } from '../../types/ui.types.js'
import type { UserColorService } from '../user-color-service.js'
import { formatShortTime } from '../hooks/use-clock.js'

type MessagesProps = {
  messages: ChatEntry[]
  colorService: UserColorService
  height: number
  scrollOffset: number
}

export function Messages({ messages, colorService, height, scrollOffset }: MessagesProps) {
  const visibleCount = Math.max(1, height - 3)
  const end = Math.max(0, messages.length - scrollOffset)
  const start = Math.max(0, end - visibleCount)
  const visible = messages.slice(start, end)
  const hiddenAbove = start
  const hiddenBelow = messages.length - end

  return (
    <Box
      flexDirection='column'
      borderStyle='round'
      borderColor='gray'
      paddingX={1}
      height={height}
      flexGrow={1}
      overflow='hidden'
    >
      <Box justifyContent='space-between' flexShrink={0}>
        <Text bold>messages</Text>
        <Text color='gray' dimColor>
          {hiddenAbove > 0 ? `↑${hiddenAbove}  ` : ''}
          {visible.length}/{messages.length}
          {hiddenBelow > 0 ? `  ↓${hiddenBelow}` : ''}
        </Text>
      </Box>

      <Box flexDirection='column' flexGrow={1} overflow='hidden'>
        {visible.length === 0
          ? (
            <Box flexDirection='column' alignItems='center' justifyContent='center' flexGrow={1}>
              <Text color='gray' dimColor>no messages yet</Text>
            </Box>
          )
          : visible.map(msg => (
            <Text key={msg.id} wrap='wrap'>
              <Text color='gray' dimColor>{formatShortTime(msg.timestamp)} </Text>
              <Text color={colorService.getColor(msg.userName)} bold>
                {msg.userName}
              </Text>
              <Text color='gray'>: </Text>
              <Text>{msg.message}</Text>
            </Text>
          ))}
      </Box>
    </Box>
  )
}
