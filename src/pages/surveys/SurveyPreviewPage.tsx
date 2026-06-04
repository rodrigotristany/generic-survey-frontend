import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye } from 'lucide-react'
import { surveysApi } from '@/lib/surveys'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import type { GroupQuestionOut } from '@/types'

function QuestionPreview({ gq, index }: { gq: GroupQuestionOut; index: number }) {
  const { question, is_required } = gq

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium leading-snug">
        <span className="text-muted-foreground mr-2">{index}.</span>
        {question.text}
        {is_required && <span className="text-destructive ml-1">*</span>}
      </p>

      {question.question_type === 'text' && (
        <textarea
          disabled
          placeholder="Your answer…"
          rows={3}
          className="w-full rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground resize-none cursor-not-allowed"
        />
      )}

      {question.question_type === 'date' && (
        <input
          type="date"
          disabled
          className="w-48 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
        />
      )}

      {question.question_type === 'rating' && (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              disabled
              className="h-9 w-9 rounded-md border bg-muted/30 text-sm font-medium text-muted-foreground cursor-not-allowed"
            >
              {n}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">(1–5)</span>
        </div>
      )}

      {question.question_type === 'single_choice' && (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 cursor-not-allowed opacity-70">
              <input type="radio" disabled className="accent-primary" />
              <span className="text-sm">{opt.text}</span>
            </label>
          ))}
        </div>
      )}

      {question.question_type === 'multiple_choice' && (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 cursor-not-allowed opacity-70">
              <input type="checkbox" disabled className="rounded accent-primary" />
              <span className="text-sm">{opt.text}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SurveyPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveysApi.get(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!survey) return null

  const totalQuestions = survey.sections.reduce(
    (acc, s) => acc + s.groups.reduce((a, g) => a + g.group_questions.length, 0),
    0,
  )

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`/surveys/${id}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to survey
        </button>
        <Badge variant="outline" className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
          <Eye className="w-3 h-3" />
          Preview
        </Badge>
      </div>

      {/* Survey header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">{survey.title}</h1>
        {survey.description && (
          <p className="text-sm text-muted-foreground mt-2">{survey.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          {survey.sections.length} section{survey.sections.length !== 1 ? 's' : ''} · {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
        </p>
      </div>

      <Separator className="mb-8" />

      {/* Sections */}
      {survey.sections.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          This survey has no sections yet.
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {survey.sections.map((section, sIdx) => (
            <div key={section.id}>
              {/* Section header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Section {sIdx + 1}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>

              {/* Groups */}
              <div className="flex flex-col gap-8">
                {section.groups.map((group) => {
                  const groupStartIdx = section.groups
                    .slice(0, section.groups.indexOf(group))
                    .reduce((a, g) => a + g.group_questions.length, 0)

                  return (
                    <div key={group.id} className="border rounded-lg overflow-hidden">
                      {/* Group title */}
                      <div className="bg-muted/30 px-4 py-2.5 border-b">
                        <span className="text-sm font-medium">{group.title}</span>
                      </div>

                      {/* Questions */}
                      <div className="px-4 py-4 flex flex-col gap-6">
                        {group.group_questions.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No questions in this group.</p>
                        ) : (
                          group.group_questions.map((gq, qIdx) => (
                            <QuestionPreview
                              key={gq.id}
                              gq={gq}
                              index={groupStartIdx + qIdx + 1}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {sIdx < survey.sections.length - 1 && <Separator className="mt-10" />}
            </div>
          ))}
        </div>
      )}

      {/* Footer submit area */}
      {totalQuestions > 0 && (
        <div className="mt-10 flex justify-end">
          <Button disabled className="min-w-28 cursor-not-allowed opacity-60">
            Submit
          </Button>
        </div>
      )}
    </div>
  )
}
