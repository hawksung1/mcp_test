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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = (await req.json()) as MemoFormData
    const { title, content, category, tags } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { data, error } = await supabase
      .from('memos')
      .update({ title, content, category, tags: tags || [] })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ memo: mapRowToMemo(data) })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('memos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}


