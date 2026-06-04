import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Link as LinkIcon,
  BarChart2,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { surveysApi } from '@/lib/surveys'
import { questionsApi } from '@/lib/questions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { SurveyStatus, QuestionType, SectionOut, SurveyGroupOut } from '@/types'

const statusVariant: Record<SurveyStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  published: 'default',
  closed: 'secondary',
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating', label: 'Rating' },
  { value: 'date', label: 'Date' },
]

function AddSectionDialog({
  sid,
  sectionsCount,
  open,
  onClose,
}: {
  sid: string
  sectionsCount: number
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => surveysApi.addSection(sid, { title, order: sectionsCount }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['survey', sid] })
      toast.success('Section added')
      setTitle('')
      onClose()
    },
    onError: () => toast.error('Failed to add section'),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 py-2">
          <Label>Section Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Demographics" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddGroupDialog({
  sid,
  section,
  open,
  onClose,
}: {
  sid: string
  section: SectionOut
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: () =>
      surveysApi.addGroup(sid, section.id, { title, order: section.groups.length }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['survey', sid] })
      toast.success('Group added')
      setTitle('')
      onClose()
    },
    onError: () => toast.error('Failed to add group'),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Group to "{section.title}"</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 py-2">
          <Label>Group Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Work Background" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddQuestionDialog({
  sid,
  section,
  group,
  open,
  onClose,
}: {
  sid: string
  section: SectionOut
  group: SurveyGroupOut
  open: boolean
  onClose: () => void
}) {
  const [mode, setMode] = useState<'create' | 'link'>('create')
  const [text, setText] = useState('')
  const [qType, setQType] = useState<QuestionType>('text')
  const [isRequired, setIsRequired] = useState(true)
  const [options, setOptions] = useState<string[]>(['', ''])
  const [linkId, setLinkId] = useState('')
  const qc = useQueryClient()

  const { data: library } = useQuery({
    queryKey: ['questions'],
    queryFn: () => questionsApi.list(),
    enabled: mode === 'link',
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const hasOptions = ['single_choice', 'multiple_choice'].includes(qType)
      return surveysApi.addQuestion(sid, section.id, group.id, {
        text,
        question_type: qType,
        options: hasOptions
          ? options.filter(Boolean).map((t, i) => ({ text: t, order: i }))
          : undefined,
        is_required: isRequired,
        order: group.group_questions.length,
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['survey', sid] })
      toast.success('Question added')
      onClose()
    },
    onError: () => toast.error('Failed to add question'),
  })

  const linkMutation = useMutation({
    mutationFn: () =>
      surveysApi.linkQuestion(sid, section.id, group.id, {
        question_id: linkId,
        is_required: isRequired,
        order: group.group_questions.length,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['survey', sid] })
      toast.success('Question linked')
      onClose()
    },
    onError: () => toast.error('Failed to link question'),
  })

  const needsOptions = ['single_choice', 'multiple_choice'].includes(qType)
  const isPending = createMutation.isPending || linkMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Question to "{group.title}"</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={mode === 'create' ? 'default' : 'outline'}
            onClick={() => setMode('create')}
          >
            Create New
          </Button>
          <Button
            size="sm"
            variant={mode === 'link' ? 'default' : 'outline'}
            onClick={() => setMode('link')}
          >
            <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
            Link Existing
          </Button>
        </div>

        {mode === 'create' ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Question Text</Label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
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
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="rounded"
              />
              Required
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Select Question from Library</Label>
              <Select value={linkId} onValueChange={(v) => setLinkId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a question…" />
                </SelectTrigger>
                <SelectContent>
                  {library?.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="rounded"
              />
              Required
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => (mode === 'create' ? createMutation.mutate() : linkMutation.mutate())}
            disabled={isPending || (mode === 'create' ? !text.trim() : !linkId)}
          >
            {isPending ? 'Adding…' : 'Add Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDialog({
  open,
  message,
  isPending,
  onConfirm,
  onClose,
}: {
  open: boolean
  message: string
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type DialogState =
  | { type: 'none' }
  | { type: 'section' }
  | { type: 'group'; section: SectionOut }
  | { type: 'question'; section: SectionOut; group: SurveyGroupOut }

type DeleteTarget =
  | { type: 'none' }
  | { type: 'section'; sec_id: string; label: string }
  | { type: 'group'; sec_id: string; gid: string; label: string }
  | { type: 'question'; sec_id: string; gid: string; gqid: string; label: string }

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>({ type: 'none' })

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveysApi.get(id!),
    enabled: !!id,
  })

  const deleteSection = useMutation({
    mutationFn: (sec_id: string) => surveysApi.deleteSection(id!, sec_id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['survey', id] })
      toast.success('Section deleted')
      setDeleteTarget({ type: 'none' })
    },
    onError: () => toast.error('Failed to delete section'),
  })

  const deleteGroup = useMutation({
    mutationFn: ({ sec_id, gid }: { sec_id: string; gid: string }) =>
      surveysApi.deleteGroup(id!, sec_id, gid),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['survey', id] })
      toast.success('Group deleted')
      setDeleteTarget({ type: 'none' })
    },
    onError: () => toast.error('Failed to delete group'),
  })

  const removeQuestion = useMutation({
    mutationFn: ({
      sec_id,
      gid,
      gqid,
    }: {
      sec_id: string
      gid: string
      gqid: string
    }) => surveysApi.removeGroupQuestion(id!, sec_id, gid, gqid),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['survey', id] })
      toast.success('Question removed')
      setDeleteTarget({ type: 'none' })
    },
    onError: () => toast.error('Failed to remove question'),
  })

  const updateStatus = useMutation({
    mutationFn: (status: SurveyStatus) => surveysApi.update(id!, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['survey', id] }),
  })

  const toggle = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  const isDeletePending =
    deleteSection.isPending || deleteGroup.isPending || removeQuestion.isPending

  const confirmDelete = () => {
    if (deleteTarget.type === 'section') deleteSection.mutate(deleteTarget.sec_id)
    else if (deleteTarget.type === 'group')
      deleteGroup.mutate({ sec_id: deleteTarget.sec_id, gid: deleteTarget.gid })
    else if (deleteTarget.type === 'question')
      removeQuestion.mutate({
        sec_id: deleteTarget.sec_id,
        gid: deleteTarget.gid,
        gqid: deleteTarget.gqid,
      })
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!survey) return null

  const nextStatus: Record<SurveyStatus, SurveyStatus | null> = {
    draft: 'published',
    published: 'closed',
    closed: null,
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <button
            onClick={() => navigate('/surveys')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Surveys
          </button>
          <h1 className="text-2xl font-semibold">{survey.title}</h1>
          {survey.description && (
            <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={statusVariant[survey.status]}>{survey.status}</Badge>
            <span className="text-xs text-muted-foreground font-mono">{survey.slug}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/surveys/${id}/preview`)}
          >
            <Eye className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/surveys/${id}/responses`)}
          >
            <BarChart2 className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Responses</span>
          </Button>
          {nextStatus[survey.status] && (
            <Button
              size="sm"
              onClick={() => updateStatus.mutate(nextStatus[survey.status]!)}
              disabled={updateStatus.isPending}
            >
              {survey.status === 'draft' ? 'Publish' : 'Close'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {survey.sections.map((section) => (
          <div key={section.id} className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer select-none"
              onClick={() => toggle(`sec-${section.id}`)}
            >
              <div className="flex items-center gap-2">
                {collapsed[`sec-${section.id}`] ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">{section.title}</span>
                <Badge variant="outline" className="text-xs">
                  {section.groups.length} group{section.groups.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDialog({ type: 'group', section })}
                >
                  <Plus className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Group</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() =>
                    setDeleteTarget({ type: 'section', sec_id: section.id, label: section.title })
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {!collapsed[`sec-${section.id}`] && (
              <div className="divide-y">
                {section.groups.map((group) => (
                  <div key={group.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggle(`grp-${group.id}`)}
                      >
                        {collapsed[`grp-${group.id}`] ? (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{group.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {group.group_questions.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setDialog({ type: 'question', section, group })}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Question
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-destructive"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'group',
                              sec_id: section.id,
                              gid: group.id,
                              label: group.title,
                            })
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {!collapsed[`grp-${group.id}`] && (
                      <div className="ml-6 flex flex-col gap-2 mt-2">
                        {group.group_questions.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            No questions yet — add one above
                          </p>
                        ) : (
                          group.group_questions.map((gq, idx) => (
                            <div
                              key={gq.id}
                              className="flex items-start justify-between bg-muted/20 rounded-md px-3 py-2 gap-3"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="text-xs text-muted-foreground mt-0.5 shrink-0">
                                  {idx + 1}.
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm leading-snug break-words">
                                    {gq.question.text}
                                    {gq.is_required && (
                                      <span className="text-destructive ml-1">*</span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      {gq.question.question_type}
                                    </Badge>
                                    {gq.question.options.length > 0 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {gq.question.options.length} options
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-muted">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: 'question',
                                        sec_id: section.id,
                                        gid: group.id,
                                        gqid: gq.id,
                                        label: gq.question.text,
                                      })
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {section.groups.length === 0 && (
                  <div className="px-10 py-4 text-xs text-muted-foreground italic">
                    No groups yet
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setDialog({ type: 'section' })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      <Separator className="my-6" />

      <ConfirmDialog
        open={deleteTarget.type !== 'none'}
        message={
          deleteTarget.type !== 'none'
            ? `Delete "${deleteTarget.label}"? This cannot be undone.`
            : ''
        }
        isPending={isDeletePending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget({ type: 'none' })}
      />

      {/* Dialogs */}
      {dialog.type === 'section' && (
        <AddSectionDialog
          sid={id!}
          sectionsCount={survey.sections.length}
          open
          onClose={() => setDialog({ type: 'none' })}
        />
      )}
      {dialog.type === 'group' && (
        <AddGroupDialog
          sid={id!}
          section={dialog.section}
          open
          onClose={() => setDialog({ type: 'none' })}
        />
      )}
      {dialog.type === 'question' && (
        <AddQuestionDialog
          sid={id!}
          section={dialog.section}
          group={dialog.group}
          open
          onClose={() => setDialog({ type: 'none' })}
        />
      )}
    </div>
  )
}
