'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">로딩 중...</div>
})
const Markdown = dynamic(() => import('@uiw/react-markdown-preview'), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">로드 중...</div>,
})
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import { Memo, MemoFormData, MEMO_CATEGORIES } from '@/types/memo'

interface MemoDetailModalProps {
  isOpen: boolean
  memo: Memo
  onClose: () => void
  onUpdate: (id: string, data: MemoFormData) => void
  onDelete: (id: string) => void
}

export default function MemoDetailModal({ isOpen, memo, onClose, onUpdate, onDelete }: MemoDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [draft, setDraft] = useState<MemoFormData>({
    title: memo.title,
    content: memo.content,
    category: memo.category,
    tags: memo.tags,
  })
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [summaryError, setSummaryError] = useState<string>('')
  const [summaryExpanded, setSummaryExpanded] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setIsEditing(false)
      setDraft({
        title: memo.title,
        content: memo.content,
        category: memo.category,
        tags: memo.tags,
      })
      setSummary('')
      setSummaryError('')
    }
  }, [isOpen, memo])

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSave = () => {
    if (!draft.title.trim() || !draft.content.trim()) return
    onUpdate(memo.id, draft)
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(memo.id)
    setShowConfirm(false)
    onClose()
  }

  const handleSummarize = async () => {
    try {
      setIsSummarizing(true)
      setSummaryError('')
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: memo.title, content: memo.content }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '요약 요청 실패')
      }
      const data = await res.json()
      setSummary(data.summary || '')
    } catch (e: any) {
      setSummaryError(e?.message || '요약 중 오류가 발생했습니다')
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleCopySummary = async () => {
    try {
      if (!summary) return
      await navigator.clipboard.writeText(summary)
    } catch (e) {
      // ignore
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy="memo-detail-title">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  value={draft.title}
                  onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="제목"
                />
              ) : (
                <h2 id="memo-detail-title" className="text-xl font-semibold text-gray-900">
                  {memo.title}
                </h2>
              )}
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] || memo.category}
                </span>
                <span>생성: {formatDateTime(memo.createdAt)}</span>
                <span>수정: {formatDateTime(memo.updatedAt)}</span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="편집"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            {!isEditing && (
              <button
                onClick={handleSummarize}
                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="요약"
                disabled={isSummarizing}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            )}
              <button
                onClick={() => setShowConfirm(true)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="닫기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              {isEditing ? (
                <select
                  value={draft.category}
                  onChange={e => setDraft(prev => ({ ...prev, category: e.target.value }))}
                  className="text-gray-400 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {Object.entries(MEMO_CATEGORIES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-gray-700">{MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES]}</div>
              )}
            </div>

            <div data-color-mode="light">
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              {isEditing ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <MDEditor
                    value={draft.content}
                    onChange={value => setDraft(prev => ({ ...prev, content: value || '' }))}
                    preview="edit"
                    height={360}
                  />
                </div>
              ) : (
                <div className="prose max-w-none">
                  <Markdown source={memo.content} />
                </div>
              )}
            </div>

            {!isEditing && (
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-600 text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-emerald-900">요약</span>
                    {isSummarizing && (
                      <span className="text-xs text-emerald-700 bg-white/70 px-2 py-0.5 rounded border border-emerald-200">생성 중...</span>
                    )}
                    {summaryError && (
                      <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">오류</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                      className="text-xs px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      title="재생성"
                    >
                      재생성
                    </button>
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      disabled={!summary}
                      className="text-xs px-2 py-1 rounded-md bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                      title="복사"
                    >
                      복사
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryExpanded(v => !v)}
                      className="text-xs px-2 py-1 rounded-md text-emerald-900 hover:bg-emerald-100"
                      title={summaryExpanded ? '접기' : '펼치기'}
                    >
                      {summaryExpanded ? '접기' : '펼치기'}
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-4 py-3">
                  {summaryError ? (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                      {summaryError}
                    </div>
                  ) : isSummarizing ? (
                    <div className="space-y-2">
                      <div className="h-3 bg-emerald-200/60 rounded animate-pulse"></div>
                      <div className="h-3 bg-emerald-200/60 rounded animate-pulse w-11/12"></div>
                      <div className="h-3 bg-emerald-200/60 rounded animate-pulse w-10/12"></div>
                      <div className="h-3 bg-emerald-200/60 rounded animate-pulse w-9/12"></div>
                    </div>
                  ) : summary ? (
                    summaryExpanded ? (
                      <div className="prose prose-emerald max-w-none">
                        <Markdown source={summary} />
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-900 line-clamp-3 whitespace-pre-wrap">{summary}</div>
                    )
                  ) : (
                    <div className="text-sm text-emerald-900/70">요약 결과가 없습니다. 상단의 번개 아이콘 또는 재생성 버튼을 눌러 생성하세요.</div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
              {isEditing ? (
                <input
                  value={draft.tags.join(', ')}
                  onChange={e => {
                    const raw = e.target.value
                    const tags = raw
                      .split(',')
                      .map(t => t.trim())
                      .filter(Boolean)
                    setDraft(prev => ({ ...prev, tags }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="쉼표로 태그를 구분하세요"
                />
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {memo.tags.length === 0 ? (
                    <span className="text-gray-400">태그 없음</span>
                  ) : (
                    memo.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">#{tag}</span>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 풋터 */}
          <div className="mt-6 flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  저장
                </button>
              </>
            ) : null}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        title="메모 삭제"
        message={'정말로 이 메모를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}


