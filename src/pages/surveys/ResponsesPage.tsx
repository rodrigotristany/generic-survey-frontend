import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye } from 'lucide-react'
import { surveysApi, responsesApi } from '@/lib/surveys'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SurveyResponseOut, SurveyOut } from '@/types'

function ResponseDetail({
  response,
  survey,
}: {
  response: SurveyResponseOut
  survey: SurveyOut
}) {
  const questionMap = new Map<string, string>()
  survey.sections.forEach((sec) =>
    sec.groups.forEach((grp) =>
      grp.group_questions.forEach((gq) => questionMap.set(gq.id, gq.question.text)),
    ),
  )

  const optionMap = new Map<string, string>()
  survey.sections.forEach((sec) =>
    sec.groups.forEach((grp) =>
      grp.group_questions.forEach((gq) =>
        gq.question.options.forEach((o) => optionMap.set(o.id, o.text)),
      ),
    ),
  )

  return (
    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
      {response.answers.map((answer) => {
        const qText = questionMap.get(answer.group_question_id) ?? answer.group_question_id
        let valueDisplay = '—'
        if (answer.text_value) valueDisplay = answer.text_value
        else if (answer.rating_value != null) valueDisplay = `${answer.rating_value} / 5`
        else if (answer.date_value) valueDisplay = answer.date_value
        else if (answer.selected_option_ids.length > 0)
          valueDisplay = answer.selected_option_ids
            .map((oid) => optionMap.get(oid) ?? oid)
            .join(', ')

        return (
          <div key={answer.id} className="rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground mb-1">{qText}</p>
            <p className="text-sm">{valueDisplay}</p>
          </div>
        )
      })}
      {response.answers.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No answers recorded</p>
      )}
    </div>
  )
}

export default function ResponsesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<SurveyResponseOut | null>(null)

  const { data: survey } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveysApi.get(id!),
    enabled: !!id,
  })

  const { data: responses, isLoading } = useQuery({
    queryKey: ['responses', id],
    queryFn: () => responsesApi.listForSurvey(id!),
    enabled: !!id,
  })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(`/surveys/${id}`)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to survey
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Responses</h1>
          {survey && (
            <p className="text-sm text-muted-foreground mt-1">{survey.title}</p>
          )}
        </div>
        <Badge variant="outline">
          {responses?.length ?? '—'} total
        </Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Response ID</TableHead>
              <TableHead className="hidden sm:table-cell">User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Submitted</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : responses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No responses yet
                </TableCell>
              </TableRow>
            ) : (
              responses?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {r.user_id ? r.user_id.slice(0, 8) + '…' : 'Anonymous'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'submitted' ? 'default' : 'outline'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {r.submitted_at
                      ? new Date(r.submitted_at).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(r)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Response Detail</DialogTitle>
          </DialogHeader>
          {selected && survey && (
            <ResponseDetail response={selected} survey={survey} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
