import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { questionsApi } from '@/lib/questions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { QuestionType, QuestionOut } from '@/types'

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating', label: 'Rating' },
  { value: 'date', label: 'Date' },
]

function CreateQuestionDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [qType, setQType] = useState<QuestionType>('text')
  const [options, setOptions] = useState<string[]>(['', ''])
  const qc = useQueryClient()

  const needsOptions = ['single_choice', 'multiple_choice'].includes(qType)

  const mutation = useMutation({
    mutationFn: () =>
      questionsApi.create({
        text,
        question_type: qType,
        options: needsOptions
          ? options.filter(Boolean).map((t, i) => ({ text: t, order: i }))
          : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] })
      toast.success('Question created')
      setText('')
      setQType('text')
      setOptions(['', ''])
      onClose()
    },
    onError: () => toast.error('Failed to create question'),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Question</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Question Text</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What do you want to ask?"
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={qType} onValueChange={(v) => setQType(v as QuestionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {needsOptions && (
            <div className="flex flex-col gap-2">
              <Label>Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options]
                      next[i] = e.target.value
                      setOptions(next)
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOptions([...options, ''])}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Option
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!text.trim() || mutation.isPending}
          >
            {mutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QuestionRow({ q }: { q: QuestionOut }) {
  const [expanded, setExpanded] = useState(false)
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => questionsApi.delete(q.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] })
      toast.success('Question deleted')
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        toast.error('Cannot delete: question is in use by a survey')
      } else {
        toast.error('Failed to delete question')
      }
    },
  })

  const hasOptions = q.options.length > 0

  return (
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-start justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 select-none"
        onClick={() => hasOptions && setExpanded((p) => !p)}
      >
        <div className="flex items-start gap-2 min-w-0">
          {hasOptions ? (
            expanded ? (
              <ChevronDown className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            )
          ) : (
            <div className="w-4 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium break-words">{q.text}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {q.question_type}
              </Badge>
              {hasOptions && (
                <span className="text-[10px] text-muted-foreground">
                  {q.options.length} options
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive shrink-0 ml-2"
          onClick={(e) => {
            e.stopPropagation()
            deleteMutation.mutate()
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      {expanded && hasOptions && (
        <div className="px-10 pb-3 flex flex-col gap-1">
          {q.options.map((opt) => (
            <div key={opt.id} className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
              {opt.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function QuestionLibraryPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all')

  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', typeFilter, search],
    queryFn: () =>
      questionsApi.list({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search || undefined,
      }),
  })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Question Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reusable questions that can be linked to any survey
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Question
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as QuestionType | 'all')}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {QUESTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : questions?.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-sm">No questions found</p>
            <Button
              variant="link"
              className="mt-2 text-sm"
              onClick={() => setCreateOpen(true)}
            >
              Create your first question
            </Button>
          </div>
        ) : (
          questions?.map((q) => <QuestionRow key={q.id} q={q} />)
        )}
      </div>

      <CreateQuestionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
