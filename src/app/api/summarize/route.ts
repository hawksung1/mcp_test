import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json()
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GOOGLE_API_KEY' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    const prompt = [
      '당신은 한국어 요약가입니다.',
      '다음 메모를 5줄 이내 핵심 bullet로 간결하게 요약하세요.',
      '가능하면 태그/카테고리 뉘앙스도 반영하되 과장하지 마세요.',
      title ? `제목: ${title}` : '',
      '본문:\n\n',
      content,
    ]
      .filter(Boolean)
      .join('\n')

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        maxOutputTokens: 300,
        temperature: 0.3,
      },
    })

    const summary = response.text || ''
    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Summarize error:', error)
    return NextResponse.json({ error: error?.message || 'Internal Error' }, { status: 500 })
  }
}



