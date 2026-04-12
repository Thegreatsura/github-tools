import { defineHandler } from 'nitro/h3'
import { agent } from '../../lib/agent'

export default defineHandler(async (event) => {
  const handler = agent.webhooks.github
  if (!handler) {
    return new Response('GitHub adapter not configured', { status: 404 })
  }
  return handler(event.req, {
    waitUntil: (task: Promise<unknown>) => event.waitUntil(task),
  })
})
