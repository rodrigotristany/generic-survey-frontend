import { api } from './api'
import type { QuestionOut, OptionOut, QuestionType } from '@/types'

export const questionsApi = {
  list: (params?: { type?: QuestionType; search?: string }) =>
    api.get<QuestionOut[]>('/admin/questions', { params }).then((r) => r.data),

  get: (qid: string) => api.get<QuestionOut>(`/admin/questions/${qid}`).then((r) => r.data),

  create: (body: {
    text: string
    question_type: QuestionType
    options?: { text: string; order: number }[]
  }) => api.post<QuestionOut>('/admin/questions', body).then((r) => r.data),

  update: (qid: string, body: { text?: string; question_type?: QuestionType }) =>
    api.patch<QuestionOut>(`/admin/questions/${qid}`, body).then((r) => r.data),

  delete: (qid: string) => api.delete(`/admin/questions/${qid}`).then((r) => r.data),

  addOption: (qid: string, body: { text: string; order: number }) =>
    api.post<OptionOut>(`/admin/questions/${qid}/options`, body).then((r) => r.data),

  updateOption: (qid: string, oid: string, body: { text?: string; order?: number }) =>
    api.patch<OptionOut>(`/admin/questions/${qid}/options/${oid}`, body).then((r) => r.data),

  deleteOption: (qid: string, oid: string) =>
    api.delete(`/admin/questions/${qid}/options/${oid}`).then((r) => r.data),
}
