import { AIChatAgent } from '@cloudflare/ai-chat'
import { routeAgentRequest } from 'agents'
import { createWorkersAI } from 'workers-ai-provider'
import { streamText, convertToModelMessages, pruneMessages, tool, stepCountIs } from 'ai'
import { z } from 'zod'

export interface Env {
  AI: Ai
  ChatAgent: DurableObjectNamespace
}

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const workersai = createWorkersAI({ binding: this.env.AI })

    const result = streamText({
      model: workersai('@cf/meta/llama-4-scout-17b-16e-instruct'),
      system:
        'You are a helpful assistant running on Cloudflare Agents at the edge. ' +
        "You can check the weather for any city, get the user's timezone from their browser, " +
        'and run math calculations (note: calculations over 1000 require user approval). ' +
        'Be concise and friendly. Use tools when relevant.',
      messages: pruneMessages({
        messages: await convertToModelMessages(this.messages),
        toolCalls: 'before-last-2-messages',
      }),
      tools: {
        // Server-side tool: executes automatically on the server
        getWeather: tool({
          description: 'Get the current weather for a city',
          inputSchema: z.object({
            city: z.string().describe('City name'),
          }),
          execute: async ({ city }) => {
            const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'partly cloudy']
            const temp = Math.floor(Math.random() * 30) + 5
            const humidity = Math.floor(Math.random() * 50) + 30
            return {
              city,
              temperature: temp,
              condition: conditions[Math.floor(Math.random() * conditions.length)],
              humidity,
              unit: 'celsius',
            }
          },
        }),

        // Client-side tool: no execute function — the browser handles it
        getUserTimezone: tool({
          description: "Get the user's timezone from their browser",
          inputSchema: z.object({}),
        }),

        // Approval-gated tool: requires user confirmation for large numbers
        calculate: tool({
          description:
            'Perform a math calculation with two numbers. ' +
            'Requires user approval when either number exceeds 1000.',
          inputSchema: z.object({
            a: z.number().describe('First number'),
            b: z.number().describe('Second number'),
            operator: z
              .enum(['+', '-', '*', '/', '%'])
              .describe('Arithmetic operator'),
          }),
          needsApproval: async ({ a, b }) => Math.abs(a) > 1000 || Math.abs(b) > 1000,
          execute: async ({ a, b, operator }) => {
            const ops: Record<string, (x: number, y: number) => number> = {
              '+': (x, y) => x + y,
              '-': (x, y) => x - y,
              '*': (x, y) => x * y,
              '/': (x, y) => x / y,
              '%': (x, y) => x % y,
            }
            if (operator === '/' && b === 0) {
              return { error: 'Division by zero' }
            }
            return {
              expression: `${a} ${operator} ${b}`,
              result: ops[operator](a, b),
            }
          },
        }),
      },
      stopWhen: stepCountIs(5),
    })

    return result.toUIMessageStreamResponse()
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Extensions',
}

function addCors(response: Response): Response {
  // WebSocket upgrade responses (101) cannot be reconstructed — leave them untouched.
  if (response.status === 101) return response
  const headers = new Headers(response.headers)
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const response = await routeAgentRequest(request, env)
    if (response) return addCors(response)

    return new Response('Not found', { status: 404, headers: CORS_HEADERS })
  },
}
