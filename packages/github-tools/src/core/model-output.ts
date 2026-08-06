const MAX_PATCH_LENGTH = 4000
const MAX_CONTENT_LENGTH = 20000

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}\n\n[truncated: ${text.length - maxLength} more characters]`
}

function truncatePatchFields<T extends { patch?: string }>(files: T[]): T[] {
  return files.map(file => ({
    ...file,
    patch: file.patch ? truncateText(file.patch, MAX_PATCH_LENGTH) : file.patch,
  }))
}

type ToModelOutputOptions = {
  toolCallId: string
  input: unknown
  output: unknown
}

type ListPullRequestFilesOutput = Array<{
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
}>

type GetCommitOutput = {
  sha: string
  message: string
  author?: string
  authorLogin?: string
  date?: string
  url: string
  stats: { additions: number, deletions: number, total: number } | null
  files?: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    patch?: string
  }>
}

type GetFileContentOutput =
  | { type: 'directory', entries: Array<{ name: string, type: string, path: string }> }
  | { type: string, path: string }
  | {
      type: 'file'
      path: string
      sha: string
      size: number
      content: string
      totalLines?: number
      startLine?: number
      endLine?: number
      truncated?: boolean
    }

export function listPullRequestFilesToModelOutput({ output }: ToModelOutputOptions) {
  const files = output as ListPullRequestFilesOutput
  return {
    type: 'json' as const,
    value: truncatePatchFields(files),
  }
}

export function getCommitToModelOutput({ output }: ToModelOutputOptions) {
  const commit = output as GetCommitOutput
  return {
    type: 'json' as const,
    value: {
      ...commit,
      files: commit.files ? truncatePatchFields(commit.files) : commit.files,
    },
  }
}

type CompareCommitsOutput = {
  status: string
  aheadBy: number
  behindBy: number
  totalCommits: number
  url: string
  commits: Array<{ sha: string, message: string, author?: string, authorLogin?: string }>
  files?: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    patch?: string
  }>
}

export function compareCommitsToModelOutput({ output }: ToModelOutputOptions) {
  const comparison = output as CompareCommitsOutput
  return {
    type: 'json' as const,
    value: {
      ...comparison,
      files: comparison.files ? truncatePatchFields(comparison.files) : comparison.files,
    },
  }
}

export function getFileContentToModelOutput({ output }: ToModelOutputOptions) {
  const result = output as GetFileContentOutput
  if ('content' in result && result.content.length > MAX_CONTENT_LENGTH) {
    return {
      type: 'json' as const,
      value: {
        ...result,
        content: truncateText(result.content, MAX_CONTENT_LENGTH),
      },
    }
  }
  return { type: 'json' as const, value: result }
}

type GetPullRequestContextOutput = {
  pullRequest: {
    number: number
    title: string
    body: string | null
    state: string
    url: string
    author?: string
    branch: string
    headSha: string
    base: string
    draft?: boolean
    merged: boolean
    mergeable: boolean | null
    additions: number
    deletions: number
    changedFiles: number
    createdAt: string
    updatedAt: string
    mergedAt: string | null
  }
  files?: ListPullRequestFilesOutput
  reviews?: Array<{
    id: number
    state: string
    body: string
    author?: string
    url: string
    submittedAt?: string | null
  }>
  checks?: {
    checkRuns: {
      totalCount: number
      checkRuns: Array<{
        id: number
        name: string
        status: string
        conclusion: string | null
        url: string | null
        startedAt: string | null
        completedAt: string | null
      }>
    }
    combinedStatus: {
      state: string
      totalCount: number
      statuses: Array<{
        context: string
        state: string
        description: string | null
        url: string | null
      }>
    }
  }
}

export function getPullRequestContextToModelOutput({ output }: ToModelOutputOptions) {
  const result = output as GetPullRequestContextOutput
  return {
    type: 'json' as const,
    value: {
      ...result,
      files: result.files ? truncatePatchFields(result.files) : result.files,
    },
  }
}
