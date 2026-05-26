import { Box, Text } from 'ink'
import figures from 'figures'
import type { ActivityEntry } from '../../types/ui.types.js'
import type { UserColorService } from '../user-color-service.js'
import { formatShortTime } from '../hooks/use-clock.js'

type SidebarProps = {
  users: string[]
  activity: ActivityEntry[]
  currentUser: string
  colorService: UserColorService
  height: number
  width: number
}

export function Sidebar({ users, activity, currentUser, colorService, height, width }: SidebarProps) {
  const onlineH = Math.max(4, Math.floor(height / 2))
  const activityH = Math.max(4, height - onlineH)
  const onlineCap = Math.max(0, onlineH - 3)
  const activityCap = Math.max(0, activityH - 3)

  const usersShown = users.slice(0, onlineCap)
  const usersExtra = users.length - usersShown.length
  const activityShown = activity.slice(-activityCap)

  return (
    <Box flexDirection='column' width={width} height={height} flexShrink={0}>
      <Box
        borderStyle='round'
        borderColor='gray'
        flexDirection='column'
        paddingX={1}
        height={onlineH}
        width={width}
        overflow='hidden'
        flexShrink={0}
      >
        <Text bold>
          online <Text color='gray' dimColor>({users.length})</Text>
        </Text>
        {users.length === 0
          ? <Text color='gray' dimColor>(empty)</Text>
          : usersShown.map(name => {
            const isSelf = name === currentUser
            return (
              <Text key={name} wrap='truncate-end'>
                <Text color={colorService.getColor(name)}>
                  {figures.bullet}{' '}
                </Text>
                <Text color={colorService.getColor(name)} bold={isSelf}>
                  {name}
                </Text>
                {isSelf && <Text color='gray' dimColor> (you)</Text>}
              </Text>
            )
          })}
        {usersExtra > 0 && <Text color='gray' dimColor>+{usersExtra} more</Text>}
      </Box>

      <Box
        borderStyle='round'
        borderColor='gray'
        flexDirection='column'
        paddingX={1}
        height={activityH}
        width={width}
        overflow='hidden'
        flexShrink={0}
      >
        <Text bold>activity</Text>
        {activityShown.length === 0
          ? <Text color='gray' dimColor>(no activity)</Text>
          : activityShown.map(entry => (
            <Text key={entry.id} wrap='truncate-end'>
              <Text color='gray' dimColor>{formatShortTime(entry.timestamp)} </Text>
              <Text color={entry.action === 'joined' ? 'green' : 'red'}>
                {entry.action === 'joined' ? '+' : '-'}
              </Text>
              <Text color={colorService.getColor(entry.userName)}> {entry.userName}</Text>
            </Text>
          ))}
      </Box>
    </Box>
  )
}
