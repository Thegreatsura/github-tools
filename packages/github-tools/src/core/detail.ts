import { z } from 'zod'

export const SUMMARY_BODY_LENGTH = 500

/**
 * Controls how much text is returned for bodies/notes.
 * - `summary` — truncate long bodies (~500 chars) to save tokens (default)
 * - `full` — return the complete body
 */
export const detailSchema = z
  .enum(['summary', 'full'])
  .optional()
  .default('summary')
  .describe('summary truncates long bodies (~500 chars) to save tokens; full returns the complete body')

export type DetailLevel = 'summary' | 'full'

/**
 * Truncate a body/notes string when `detail` is `summary`.
 * Returns the original value when `full`, null/undefined, or already short.
 */
export function applyDetailBody(
  body: string | null | undefined,
  detail: DetailLevel,
  maxLength = SUMMARY_BODY_LENGTH,
): string | null | undefined {
  if (detail === 'full' || body == null || body.length <= maxLength) return body
  return `${body.slice(0, maxLength)}\n\n[truncated: ${body.length - maxLength} more characters]`
}
