export class UserColorService {
  private readonly colors = new Map<string, string>()

  getColor(userName: string): string {
    const cached = this.colors.get(userName)
    if (cached !== undefined) return cached

    const hex = ((1 << 24) * Math.random() | 0).toString(16).padStart(6, '0')
    const color = `#${hex}-fg`
    this.colors.set(userName, color)
    return color
  }
}
