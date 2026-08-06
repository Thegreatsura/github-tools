import { z } from 'zod'
import type { GithubTool } from '../types'

/**
 * Default repository / issue / PR / ref values applied to tool inputs and
 * injected into agent system prompts.
 *
 * When a field is set here, matching tool schema fields become optional and
 * default to this value if the model omits them.
 */
export type GithubToolsContext = {
  owner?: string
  repo?: string
  pullNumber?: number
  issueNumber?: number
  ref?: string
}

const CONTEXT_KEYS = ['owner', 'repo', 'pullNumber', 'issueNumber', 'ref'] as const

function hasContextValues(context: GithubToolsContext): boolean {
  return CONTEXT_KEYS.some(key => context[key] !== undefined)
}

/**
 * Format a short system-prompt block describing the working context.
 * Returns an empty string when no context fields are set.
 */
export function formatContextInstructions(context: GithubToolsContext): string {
  if (!hasContextValues(context)) return ''

  const parts: string[] = []
  if (context.owner && context.repo) parts.push(`repository ${context.owner}/${context.repo}`)
  else if (context.owner) parts.push(`owner ${context.owner}`)
  else if (context.repo) parts.push(`repository ${context.repo}`)
  if (context.pullNumber != null) parts.push(`pull request #${context.pullNumber}`)
  if (context.issueNumber != null) parts.push(`issue #${context.issueNumber}`)
  if (context.ref) parts.push(`ref ${context.ref}`)

  return `Working context: ${parts.join(', ')}. Prefer these values when calling tools — omit owner, repo, pullNumber, issueNumber, or ref when they match this context.`
}

/**
 * Fill missing context fields on tool args from {@link GithubToolsContext}.
 * Explicit args always win over context defaults.
 */
export function mergeContextArgs(
  args: Record<string, unknown>,
  context: GithubToolsContext,
): Record<string, unknown> {
  const merged = { ...args }
  for (const key of CONTEXT_KEYS) {
    if (merged[key] === undefined && context[key] !== undefined) {
      merged[key] = context[key]
    }
  }
  return merged
}

function withContextDefault(field: z.ZodTypeAny, value: string | number): z.ZodTypeAny {
  if (field instanceof z.ZodDefault) {
    return withContextDefault(field.def.innerType as z.ZodTypeAny, value)
  }
  if (field instanceof z.ZodOptional) {
    return withContextDefault(field.unwrap() as z.ZodTypeAny, value)
  }
  return field.default(value)
}

/**
 * Soften matching context fields on a Zod object schema so the model may omit them.
 * Fields present in `context` get a Zod `.default(value)`.
 */
export function softenContextSchema(schema: z.ZodType, context: GithubToolsContext): z.ZodType {
  if (!(schema instanceof z.ZodObject)) return schema

  const shape = schema.shape as Record<string, z.ZodTypeAny>
  let changed = false
  const nextShape: Record<string, z.ZodTypeAny> = { ...shape }

  for (const key of CONTEXT_KEYS) {
    const value = context[key]
    if (value === undefined || !(key in shape)) continue
    nextShape[key] = withContextDefault(shape[key], value)
    changed = true
  }

  return changed ? z.object(nextShape) : schema
}

/**
 * Bind {@link GithubToolsContext} defaults onto a tool: softens matching input
 * fields and merges context into execute args when the model omits them.
 */
export function bindToolContext(tool: GithubTool, context: GithubToolsContext): GithubTool {
  if (!hasContextValues(context) || !tool.inputSchema) return tool

  const inputSchema = softenContextSchema(tool.inputSchema as z.ZodType, context)
  const originalExecute = tool.execute
  if (!originalExecute) {
    return { ...tool, inputSchema }
  }

  return {
    ...tool,
    inputSchema,
    execute: async (args, options) =>
      originalExecute(
        mergeContextArgs(args as Record<string, unknown>, context),
        options,
      ),
  }
}

/**
 * Apply {@link GithubToolsContext} to every tool in a set.
 */
export function bindToolsContext<T extends Record<string, GithubTool>>(
  tools: T,
  context: GithubToolsContext | undefined,
): T {
  if (!context || !hasContextValues(context)) return tools

  const bound = {} as T
  for (const [name, tool] of Object.entries(tools) as Array<[keyof T & string, GithubTool]>) {
    bound[name as keyof T] = bindToolContext(tool, context) as T[keyof T]
  }
  return bound
}
