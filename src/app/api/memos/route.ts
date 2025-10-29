import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'
import { Memo, MemoFormData } from '@/types/memo'

type MemoRow = {
  id: string
  title: string
  content: string
  category: string
  tags: string[] | null
  created_at: string
  updated_at: string
}

const mapRowToMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function GET() {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ memos: (data || []).map(mapRowToMemo) })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MemoFormData
    const { title, content, category, tags } = body
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('memos')
      .insert([{ title, content, category, tags: tags || [] }])
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ memo: mapRowToMemo(data) })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}


