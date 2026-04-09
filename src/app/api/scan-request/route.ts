import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are an enablement program designer at Gladly. Analyze this request and return JSON only.

Request: "${text}"

Return this exact JSON shape:
{
  "need": "one sentence describing the enablement need",
  "tracks": ["T1"|"T2"|"T3"|"T4"|"T5"|"T6"|"Custom"],
  "suggestedActivities": ["activity 1", "activity 2", "activity 3"],
  "relatedLaunch": "launch name if you can infer one, or null",
  "urgency": "high"|"medium"|"low"
}

Track guide: T1=Pipeline Driver, T2=Blocker Buster, T3=Unlearn/Relearn, T4=New Audience, T5=Retire+Replace, T6=Partner/Migration`
    }]
  })

  try {
    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(content)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }
}
