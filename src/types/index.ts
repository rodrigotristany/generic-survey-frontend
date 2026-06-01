export type SurveyStatus = 'draft' | 'published' | 'closed'
export type QuestionType = 'text' | 'single_choice' | 'multiple_choice' | 'rating' | 'date'
export type ResponseStatus = 'in_progress' | 'submitted'
export type AdminRole = 'superadmin' | 'staff'

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export interface MessageResponse {
  message: string
}

export interface UserResponse {
  id: string
  email: string
  full_name: string | null
  enabled: boolean
}

export interface OptionOut {
  id: string
  text: string
  order: number
}

export interface QuestionOut {
  id: string
  text: string
  question_type: QuestionType
  options: OptionOut[]
}

export interface GroupQuestionOut {
  id: string
  question_id: string
  is_required: boolean
  order: number
  question: QuestionOut
}

export interface SurveyGroupOut {
  id: string
  title: string
  order: number
  group_questions: GroupQuestionOut[]
}

export interface SectionOut {
  id: string
  title: string
  order: number
  groups: SurveyGroupOut[]
}

export interface SurveyOut {
  id: string
  title: string
  slug: string
  description: string | null
  status: SurveyStatus
  created_by: string
  sections: SectionOut[]
}

export interface SurveyListItem {
  id: string
  title: string
  slug: string
  status: SurveyStatus
  question_count: number
}

export interface AnswerOut {
  id: string
  group_question_id: string
  text_value: string | null
  rating_value: number | null
  date_value: string | null
  selected_option_ids: string[]
}

export interface SurveyResponseOut {
  id: string
  survey_id: string
  user_id: string | null
  status: ResponseStatus
  submitted_at: string | null
  answers: AnswerOut[]
}
