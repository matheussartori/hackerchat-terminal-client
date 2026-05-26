import { Box, Text } from 'ink'
import { formatTime, useClock } from '../hooks/use-clock.js'

type HeaderProps = {
  room: string
  userName: string
  connected: boolean
}

export function Header({ room, userName, connected }: HeaderProps) {
  const now = useClock()

  return (
    <Box
      borderStyle='round'
      borderColor='gray'
      paddingX={1}
      justifyContent='space-between'
      height={3}
      flexShrink={0}
    >
      <Box>
        <Text bold>hackerchat</Text>
        <Text color='gray' dimColor>  v1.0.0</Text>
      </Box>

      <Box>
        <Text color='gray'>#{room}</Text>
        <Text color='gray' dimColor>  ·  </Text>
        <Text color={connected ? 'green' : 'red'}>
          {connected ? '●' : '○'} {connected ? 'online' : 'offline'}
        </Text>
        <Text color='gray' dimColor>  ·  </Text>
        <Text color='gray'>@{userName}</Text>
        <Text color='gray' dimColor>  ·  </Text>
        <Text color='gray'>{formatTime(now)}</Text>
      </Box>
    </Box>
  )
}
