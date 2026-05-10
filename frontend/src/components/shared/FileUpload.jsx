import { useCallback, useRef, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function FileUpload({ value, onChange, className }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const validate = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed.')
      return false
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 5 MB.')
      return false
    }
    setError('')
    return true
  }

  const handleFile = useCallback((file) => {
    if (!file) return
    if (validate(file)) onChange(file)
  }, [onChange])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const isImage = value?.type?.startsWith('image/')

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {isImage ? (
            <img
              src={URL.createObjectURL(value)}
              alt="preview"
              className="h-12 w-12 rounded object-cover border border-slate-200"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded border border-slate-200 bg-white text-slate-400">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">{value.name}</p>
            <p className="text-xs text-slate-400">{(value.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); setError('') }}
            className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
            dragOver
              ? 'border-brand-400 bg-brand-50'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white'
          )}
        >
          <Upload className="h-6 w-6 text-slate-400" />
          <p className="text-sm text-slate-600">
            <span className="font-medium text-brand-600">Click to upload</span> or drag & drop
          </p>
          <p className="text-xs text-slate-400">JPG, PNG, PDF — max 5 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
