import { Box, Text } from 'ink'
import { formatTime, useClock } from '../hooks/use-clock.js'
import { VERSION } from '../../version.js'

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
        {VERSION !== '' ? <Text color='gray' dimColor>  v{VERSION}</Text> : null}
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
