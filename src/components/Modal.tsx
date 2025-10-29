'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  ariaLabelledBy?: string
}

export default function Modal({ isOpen, onClose, children, ariaLabelledBy }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<Element | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current = document.activeElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const body = document.body
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    // 최초 포커스 이동
    setTimeout(() => {
      dialogRef.current?.focus()
    }, 0)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      body.style.overflow = prevOverflow
      if ((previouslyFocused.current as HTMLElement | null)?.focus) {
        ;(previouslyFocused.current as HTMLElement).focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}


