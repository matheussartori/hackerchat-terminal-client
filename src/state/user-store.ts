import type { User } from '../types/index.js'

export class UserStore {
  private readonly users = new Map<string, string>()

  add(user: User): void {
    this.users.set(user.id, user.userName)
  }

  remove(id: string): void {
    this.users.delete(id)
  }

  updateAll(users: User[]): void {
    users.forEach(user => this.users.set(user.id, user.userName))
  }

  getNames(): string[] {
    return Array.from(this.users.values())
  }
}
