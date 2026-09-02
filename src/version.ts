import { readFileSync } from 'node:fs'

/**
 * The version npm published, read from the manifest instead of being repeated
 * in the UI, where it would quietly drift out of date on every release.
 *
 * This module ends up one directory below the package root either way: in
 * `src/` when `tsx` runs the sources, and bundled into `dist/index.js` after a
 * build. The relative path holds in both.
 */
function readVersion(): string {
  try {
    const manifest = readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    return (JSON.parse(manifest) as { version?: string }).version ?? ''
  } catch {
    // A manifest that cannot be read is no reason to refuse to start; the
    // header simply leaves the version out.
    return ''
  }
}

export const VERSION = readVersion()
