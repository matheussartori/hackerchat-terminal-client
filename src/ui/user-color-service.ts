const PALETTE = [
  '#ff7eb6', '#ffb86c', '#f1fa8c', '#a6e22e', '#50fa7b',
  '#8be9fd', '#82aaff', '#bd93f9', '#ff79c6', '#ff6e6e',
  '#5af78e', '#9aedfe', '#caa9fa', '#ffb86c', '#f1fa8c'
] as const

export class UserColorService {
  private readonly colors = new Map<string, string>()

  getColor(userName: string): string {
    const cached = this.colors.get(userName)
    if (cached !== undefined) return cached

    const hash = Array.from(userName).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const color = PALETTE[hash % PALETTE.length]
    this.colors.set(userName, color)
    return color
  }
}
