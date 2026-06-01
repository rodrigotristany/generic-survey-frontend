import { api } from './api'
import type {
  SurveyListItem,
  SurveyOut,
  SectionOut,
  SurveyGroupOut,
  GroupQuestionOut,
  SurveyResponseOut,
  SurveyStatus,
  QuestionType,
} from '@/types'

export const surveysApi = {
  list: (status?: SurveyStatus) =>
    api
      .get<SurveyListItem[]>('/admin/surveys', { params: status ? { status } : undefined })
      .then((r) => r.data),

  get: (sid: string) => api.get<SurveyOut>(`/admin/surveys/${sid}`).then((r) => r.data),

  create: (body: { title: string; description?: string | null }) =>
    api.post<SurveyOut>('/admin/surveys', body).then((r) => r.data),

  update: (sid: string, body: { title?: string; description?: string | null; status?: SurveyStatus }) =>
    api.patch<SurveyOut>(`/admin/surveys/${sid}`, body).then((r) => r.data),

  delete: (sid: string) => api.delete(`/admin/surveys/${sid}`).then((r) => r.data),

  addSection: (sid: string, body: { title: string; order: number }) =>
    api.post<SectionOut>(`/admin/surveys/${sid}/sections`, body).then((r) => r.data),

  updateSection: (sid: string, sec_id: string, body: { title?: string; order?: number }) =>
    api.patch<SectionOut>(`/admin/surveys/${sid}/sections/${sec_id}`, body).then((r) => r.data),

  deleteSection: (sid: string, sec_id: string) =>
    api.delete(`/admin/surveys/${sid}/sections/${sec_id}`).then((r) => r.data),

  addGroup: (sid: string, sec_id: string, body: { title: string; order: number }) =>
    api
      .post<SurveyGroupOut>(`/admin/surveys/${sid}/sections/${sec_id}/groups`, body)
      .then((r) => r.data),

  updateGroup: (
    sid: string,
    sec_id: string,
    gid: string,
    body: { title?: string; order?: number },
  ) =>
    api
      .patch<SurveyGroupOut>(`/admin/surveys/${sid}/sections/${sec_id}/groups/${gid}`, body)
      .then((r) => r.data),

  deleteGroup: (sid: string, sec_id: string, gid: string) =>
    api
      .delete(`/admin/surveys/${sid}/sections/${sec_id}/groups/${gid}`)
      .then((r) => r.data),

  addQuestion: (
    sid: string,
    sec_id: string,
    gid: string,
    body: {
      text: string
      question_type: QuestionType
      options?: { text: string; order: number }[]
      is_required: boolean
      order: number
    },
  ) =>
    api
      .post<GroupQuestionOut>(
        `/admin/surveys/${sid}/sections/${sec_id}/groups/${gid}/questions`,
        body,
      )
      .then((r) => r.data),

  linkQuestion: (
    sid: string,
    sec_id: string,
    gid: string,
    body: { question_id: string; is_required: boolean; order: number },
  ) =>
    api
      .post<GroupQuestionOut>(
        `/admin/surveys/${sid}/sections/${sec_id}/groups/${gid}/questions/link`,
        body,
      )
      .then((r) => r.data),

  updateGroupQuestion: (
    sid: string,
    sec_id: string,
    gid: string,
    gqid: string,
    body: { is_required?: boolean; order?: number },
  ) =>
    api
      .patch<GroupQuestionOut>(
        `/admin/surveys/${sid}/sections/${sec_id}/groups/${gid}/questions/${gqid}`,
        body,
      )
      .then((r) => r.data),

  removeGroupQuestion: (sid: string, sec_id: string, gid: string, gqid: string) =>
    api
      .delete(`/admin/surveys/${sid}/sections/${sec_id}/groups/${gid}/questions/${gqid}`)
      .then((r) => r.data),
}

export const responsesApi = {
  listForSurvey: (survey_id: string) =>
    api.get<SurveyResponseOut[]>(`/responses/surveys/${survey_id}`).then((r) => r.data),

  get: (response_id: string) =>
    api.get<SurveyResponseOut>(`/responses/${response_id}`).then((r) => r.data),
}
