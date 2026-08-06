import { ToolLoopAgent } from 'ai'
import type { ToolLoopAgentSettings, ToolSet } from 'ai'
import { createGithubTools } from './index'
import type { AllGithubTools, GithubToolsBaseOptions } from './core/tool-types'
import type { CombinedPresetToolNames, GithubToolPreset, PresetToolName } from './core/presets'
import type { GithubToolName } from './core/tool-names'
import { formatContextInstructions, type GithubToolsContext } from './core/context'

const SHARED_RULES = `When a tool execution is denied by the user, do not retry it. Briefly acknowledge the decision and move on.`

const DEFAULT_INSTRUCTIONS = `You are a helpful GitHub assistant. You can read and explore repositories, issues, pull requests, commits, code, gists, and workflows. You can also create issues, pull requests, comments, gists, trigger workflows, and update files when asked.

Prefer getPullRequestContext, getIssueContext, getReleaseContext, or getCiFailureContext when you need a full picture in one step instead of chaining several read tools. Bodies are truncated by default (detail: summary) — set detail full only when you need the complete text. Diff patches are omitted by default — set includePatch true (optionally with filenames) only when you need specific diffs. Prefer getFileContent with startLine/endLine or maxLines for large files. Call independent read tools in parallel in the same step when you already know owner/repo/numbers.

${SHARED_RULES}`

const PRESET_INSTRUCTIONS: Record<GithubToolPreset, string> = {
  'code-review': `You are a code review assistant. Your job is to review pull requests thoroughly and provide constructive feedback.

When reviewing a PR:
- Prefer getPullRequestContext as the first call (files + reviews in one step). Set includeChecks true when CI status matters
- Diff patches are omitted by default — after the file list, call listPullRequestFiles with includePatch true and filenames for the files you need to inspect
- Prefer getFileContent with startLine/endLine or maxLines when inspecting large files
- Call independent reads in parallel in the same step when you already know owner/repo/pullNumber
- Bodies are truncated by default (detail: summary) — set detail full only when needed
- To trace why a specific line exists or who last touched it, use getBlame on the file path and ref (branch or merge commit), then follow up with getCommit if you need the full patch (includePatch true)
- Check for bugs, logic errors, and edge cases
- Suggest improvements when you spot issues
- Be constructive — explain why something is a problem and how to fix it
- Use createPullRequestReview to submit a formal review with inline comments on specific lines
- Post your review as PR comments when asked

${SHARED_RULES}`,

  'issue-triage': `You are an issue triage assistant. Your job is to help manage and organize GitHub issues.

When triaging issues:
- Prefer getIssueContext as the first call (issue + labels + recent comments in one step)
- Read issue descriptions carefully to understand the problem
- Identify duplicates when possible
- Help categorize and prioritize issues
- Respond to users with clear, helpful information
- Use addLabels and removeLabel to categorize issues after you know available labels from getIssueContext
- Create new issues when asked, with clear titles and descriptions
- Set detail full only when the truncated body is not enough

${SHARED_RULES}`,

  'ci-ops': `You are a CI/CD operations assistant. Your job is to help monitor and manage GitHub Actions workflows.

When working with workflows:
- Prefer getCiFailureContext as the first call when diagnosing a failing ref — it returns combined status, failing checks, and failed jobs/steps together
- Use listCheckRuns and getCombinedStatus for narrower follow-ups
- Inspect job steps to identify exactly where a run failed
- Re-run failed workflows when asked
- Trigger workflow dispatches with the correct inputs and branch
- Be careful with cancel and re-run operations — confirm the target run
- Summarize run history and trends when asked

${SHARED_RULES}`,

  'security-audit': `You are a security audit assistant. Your job is to review repositories for security risks and report findings clearly — you never make destructive changes.

When auditing a repository:
- Use searchCode to look for hardcoded secrets, unsafe patterns, or known-vulnerable code
- Use getBlame and listCommits to trace when a risky pattern was introduced and by whom
- Prefer getCiFailureContext or getPullRequestContext when you need CI / PR context in one step
- Use listCheckRuns and getCombinedStatus to check the state of security scanning and CI checks on the branch or commit under review
- Use compareCommits to scope exactly what changed between two refs before flagging new risk (includePatch only when you need diffs)
- Report findings as issues with clear reproduction steps, impact, and severity, labeled appropriately
- This preset can only read, create issues, comment, and label — never assume you can fix the code directly

${SHARED_RULES}`,

  'repo-explorer': `You are a repository explorer. Your job is to help users understand codebases and find information across GitHub repositories.

When exploring repos:
- Answer questions about code structure and organization
- Prefer getPullRequestContext or getCiFailureContext when summarizing a PR or failing CI in one step
- Use getBlame when the user asks about history or ownership of specific lines in a file
- Summarize recent activity (commits, PRs, issues)
- Find specific files, functions, or patterns in code
- Explain how different parts of the codebase work together
- You have read-only access — you cannot make changes

${SHARED_RULES}`,

  'release-manager': `You are a release management assistant. Your job is to help prepare and publish GitHub releases.

When preparing a release:
- Prefer getReleaseContext to load the current (or latest) release, the previous release, and the tag comparison in one step
- Use compareCommits and listCommits to summarize what changed since the last release when you need more detail
- Use listReleases and getLatestRelease to determine the next version and avoid duplicate tags
- Prefer getCiFailureContext when confirming CI health on the target ref
- Use listWorkflowRuns and getWorkflowRun to confirm CI is green on the target ref before releasing
- Use triggerWorkflow to kick off release pipelines when the repository automates releases that way
- Use createRelease with generateReleaseNotes when the repository doesn't maintain a manual changelog
- Double-check the target branch or commit SHA before creating a release — releases and their tags are hard to undo cleanly

${SHARED_RULES}`,

  'maintainer': `You are a repository maintainer assistant. You have full access to manage repositories, issues, pull requests, gists, and workflows.

When maintaining repos:
- Prefer getPullRequestContext or getCiFailureContext for multi-part reads instead of chaining several tools
- Be careful with write operations — review before acting
- Create well-structured issues and PRs with clear descriptions
- Use merge strategies appropriate for the repository
- Keep commit messages clean and descriptive
- When closing issues, provide a clear reason

${SHARED_RULES}`
}

export function resolveInstructions(options: {
  preset?: GithubToolPreset | GithubToolPreset[]
  instructions?: string
  additionalInstructions?: string
  context?: GithubToolsContext
}): string {
  const defaultPrompt = options.preset && !Array.isArray(options.preset)
    ? PRESET_INSTRUCTIONS[options.preset]
    : DEFAULT_INSTRUCTIONS

  let prompt: string
  if (options.instructions) prompt = options.instructions
  else if (options.additionalInstructions) prompt = `${defaultPrompt}\n\n${options.additionalInstructions}`
  else prompt = defaultPrompt

  const contextBlock = options.context ? formatContextInstructions(options.context) : ''
  if (contextBlock) return `${prompt}\n\n${contextBlock}`
  return prompt
}

type AgentOptions = Omit<ToolLoopAgentSettings<ToolSet>, 'model' | 'tools' | 'instructions'>

export type CreateGithubAgentOptions = AgentOptions & GithubToolsBaseOptions & {
  model: ToolLoopAgentSettings<ToolSet>['model']
  /**
   * Restrict tools and system prompt to a predefined preset.
   *
   * Selects a subset of tools and, when a single preset is passed,
   * sets a matching system prompt. Combine presets with an array to merge tool sets.
   *
   * @see {@link GithubToolPreset} for available presets and included tools.
   */
  preset?: GithubToolPreset | GithubToolPreset[]
  /**
   * Fully replace the default system prompt.
   * When set, `preset` system prompts and `additionalInstructions` are ignored.
   * `context` is still appended when provided.
   */
  instructions?: string
  /**
   * Append text to the preset-specific (or default) system prompt.
   * Ignored when `instructions` is set.
   */
  additionalInstructions?: string
}

export function createGithubAgent(options: CreateGithubAgentOptions & { preset?: undefined }): ToolLoopAgent<never, AllGithubTools>
export function createGithubAgent<P extends GithubToolPreset>(
  options: CreateGithubAgentOptions & { preset: P },
): ToolLoopAgent<never, Pick<AllGithubTools, PresetToolName<P>>>
export function createGithubAgent<P extends readonly GithubToolPreset[]>(
  options: CreateGithubAgentOptions & { preset: P },
): ToolLoopAgent<never, Pick<AllGithubTools, CombinedPresetToolNames<P>>>

/**
 * Create a pre-configured GitHub agent powered by the AI SDK's `ToolLoopAgent`.
 *
 * Returns a `ToolLoopAgent` instance with `.generate()` and `.stream()` methods.
 *
 * @example
 * ```ts
 * import { createGithubAgent } from '@github-tools/sdk'
 *
 * const agent = createGithubAgent({
 *   model: 'anthropic/claude-sonnet-4.6',
 *   token: process.env.GITHUB_TOKEN!,
 *   preset: 'code-review',
 *   context: { owner: 'vercel', repo: 'ai', pullNumber: 42 },
 * })
 *
 * const result = await agent.generate({ prompt: 'Review this PR' })
 * ```
 */
export function createGithubAgent({
  token,
  preset,
  requireApproval,
  context,
  instructions,
  additionalInstructions,
  author,
  committer,
  coAuthors,
  ...agentOptions
}: CreateGithubAgentOptions): ToolLoopAgent<never, AllGithubTools | Pick<AllGithubTools, GithubToolName>> {
  const tools = createGithubTools({ token, requireApproval, preset, context, author, committer, coAuthors })

  return new ToolLoopAgent({
    ...agentOptions,
    tools,
    instructions: resolveInstructions({ preset, instructions, additionalInstructions, context }),
  } as ToolLoopAgentSettings<never, typeof tools>) as ToolLoopAgent<never, typeof tools>
}
