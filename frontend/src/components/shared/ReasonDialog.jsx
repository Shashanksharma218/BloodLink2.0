import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  categories,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Provide additional context...',
  onSubmit,
  loading = false,
  submitLabel = 'Submit',
}) {
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    onSubmit({ category, reason: reason || undefined })
  }

  const handleClose = (v) => {
    if (!v) { setCategory(''); setReason('') }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-3">
          {categories?.length > 0 && (
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{reasonLabel} <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (categories?.length > 0 && !category)}
          >
            {submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
