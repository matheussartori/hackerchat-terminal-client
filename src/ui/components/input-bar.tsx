import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

type InputBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  userName: string
  userColor: string
  scrolledUp?: boolean
}

export function InputBar({ value, onChange, onSubmit, userName, userColor, scrolledUp }: InputBarProps) {
  const charCount = value.length
  const maxLength = 500
  const nearLimit = charCount > maxLength * 0.85

  return (
    <Box flexDirection='column' flexShrink={0}>
      <Box
        borderStyle='round'
        borderColor={nearLimit ? 'red' : 'gray'}
        paddingX={1}
        height={3}
        flexShrink={0}
      >
        <Text color={userColor} bold>{userName}</Text>
        <Text color='gray' dimColor> › </Text>
        <Box flexGrow={1}>
          <TextInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            placeholder='type a message and press enter...'
          />
        </Box>
        <Text color={nearLimit ? 'red' : 'gray'} dimColor={!nearLimit}>
          {charCount}/{maxLength}
        </Text>
      </Box>

      <Box paddingX={1} height={1} flexShrink={0}>
        <Text color='gray' dimColor wrap='truncate-end'>
          enter send  ·  pgup/pgdn scroll  ·  end resume  ·  esc quit
          {scrolledUp ? '  ·  paused' : ''}
        </Text>
      </Box>
    </Box>
  )
}
