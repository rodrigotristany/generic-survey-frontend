import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Eye, MoreHorizontal, PencilLine } from 'lucide-react'
import { toast } from 'sonner'
import { surveysApi } from '@/lib/surveys'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { SurveyStatus } from '@/types'

const statusVariant: Record<SurveyStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  published: 'default',
  closed: 'secondary',
}

function CreateSurveyDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => surveysApi.create({ title, description: description || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys'] })
      toast.success('Survey created')
      setTitle('')
      setDescription('')
      onClose()
    },
    onError: () => toast.error('Failed to create survey'),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Survey</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Survey"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this survey about?"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!title.trim() || mutation.isPending}
          >
            {mutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SurveysPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys', statusFilter],
    queryFn: () =>
      surveysApi.list(statusFilter !== 'all' ? statusFilter : undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: (sid: string) => surveysApi.delete(sid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys'] })
      toast.success('Survey deleted')
    },
    onError: () => toast.error('Failed to delete survey'),
  })

  const updateStatus = useMutation({
    mutationFn: ({ sid, status }: { sid: string; status: SurveyStatus }) =>
      surveysApi.update(sid, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    onError: () => toast.error('Failed to update status'),
  })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Surveys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your surveys from here
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Survey
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as SurveyStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Questions</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : surveys?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No surveys found. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              surveys?.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell
                    className="font-medium"
                    onClick={() => navigate(`/surveys/${s.id}`)}
                  >
                    {s.title}
                  </TableCell>
                  <TableCell
                    className="hidden sm:table-cell text-muted-foreground font-mono text-xs"
                    onClick={() => navigate(`/surveys/${s.id}`)}
                  >
                    {s.slug}
                  </TableCell>
                  <TableCell onClick={() => navigate(`/surveys/${s.id}`)}>
                    <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                  </TableCell>
                  <TableCell
                    className="hidden sm:table-cell text-right"
                    onClick={() => navigate(`/surveys/${s.id}`)}
                  >
                    {s.question_count}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/surveys/${s.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/surveys/${s.id}/edit`)}>
                          <PencilLine className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {s.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ sid: s.id, status: 'published' })}
                          >
                            Publish
                          </DropdownMenuItem>
                        )}
                        {s.status === 'published' && (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ sid: s.id, status: 'closed' })}
                          >
                            Close
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(s.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateSurveyDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
