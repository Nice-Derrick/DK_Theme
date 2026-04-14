import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const releaseDir = '/root/workspace/DK_Theme_release'

execSync('npm run build', {
  cwd: projectRoot,
  stdio: 'inherit',
})

if (existsSync(releaseDir)) {
  rmSync(releaseDir, { recursive: true, force: true })
}

mkdirSync(releaseDir, { recursive: true })
cpSync(distDir, releaseDir, { recursive: true })

console.log(`Release exported to ${releaseDir}`)
