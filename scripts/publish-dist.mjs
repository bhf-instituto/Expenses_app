import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

function runGit(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function runGitOk(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  })

  return result.status === 0
}

function clearDirExceptGit(dirPath) {
  for (const entry of readdirSync(dirPath)) {
    if (entry === '.git') continue
    rmSync(join(dirPath, entry), { recursive: true, force: true })
  }
}

function copyDistContents(distDir, targetDir) {
  for (const entry of readdirSync(distDir)) {
    cpSync(join(distDir, entry), join(targetDir, entry), { recursive: true })
  }
}

function safeRemoveWorktree(repoRoot, worktreePath) {
  runGit(['worktree', 'remove', '--force', worktreePath], repoRoot)
}

const repoRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd())
const distDir = resolve(repoRoot, process.env.DIST_DIR ?? 'dist')
const distBranch = process.env.DIST_BRANCH ?? 'frontend-dist'
const distRemote = process.env.DIST_REMOTE ?? 'origin'
const shouldPush = (process.env.DIST_PUSH ?? 'false').toLowerCase() === 'true'
const worktreePath = mkdtempSync(join(tmpdir(), 'expenses-dist-'))
const branchExists = runGitOk(['show-ref', '--verify', `refs/heads/${distBranch}`], repoRoot)

if (!existsSync(distDir)) {
  throw new Error(`No existe la carpeta de build: ${distDir}`)
}

try {
  if (branchExists) {
    runGit(['worktree', 'add', '--force', worktreePath, distBranch], repoRoot)
  } else {
    runGit(['worktree', 'add', '--detach', worktreePath], repoRoot)
    runGit(['checkout', '--orphan', distBranch], worktreePath)
  }

  clearDirExceptGit(worktreePath)
  copyDistContents(distDir, worktreePath)
  writeFileSync(join(worktreePath, '.nojekyll'), '')

  runGit(['add', '-A'], worktreePath)

  const hasChanges = !runGitOk(['diff', '--cached', '--quiet'], worktreePath)
  if (hasChanges) {
    const timestamp = new Date().toISOString()
    runGit(['commit', '-m', `chore: publish dist ${timestamp}`], worktreePath)
    console.log(`Publicacion lista en rama ${distBranch}.`)
  } else {
    console.log('No hay cambios en dist para publicar.')
  }

  if (shouldPush) {
    runGit(['push', '-u', distRemote, distBranch], worktreePath)
    console.log(`Rama ${distBranch} subida a ${distRemote}.`)
  } else {
    console.log(`Sin push automatico. Para subir: git push -u ${distRemote} ${distBranch}`)
  }
} finally {
  safeRemoveWorktree(repoRoot, worktreePath)
}
