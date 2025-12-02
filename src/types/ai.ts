export type R<T = any> = { code?: number; msg?: string; data?: T }
export type TableDataInfo<T = any> = { current?: number; size?: number; total?: number; rows: T[]; code?: number; msg?: string }

export type MessageResponse = { role?: string; content?: string; name?: string }
export type ChatChoice = { finish_reason?: string; index?: number; delta?: MessageResponse; message?: MessageResponse }
export type Usage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } }
export type ChatCompletionResponse = { system_fingerprint?: string; id?: string; object?: string; created?: number; model?: string; choices?: ChatChoice[]; usage?: Usage; logprobs?: any }

export type Call = {
  sessionId?: number
  qaDetailsId?: number
  systemRole?: string
  aiPlatform?: 'deepseek' | 'chatgpt'
  model?: string
  temperature?: number
  topP?: number
  msg: string
  questionMsg?: string
  imgUrlList?: string[]
}

export type ImageGenerationCall = {
  sessionId?: number
  msg: string
  model?: string
  quality?: 'standard' | 'hd'
  size?: string
  style?: 'vivid' | 'natural'
}

export type ChatSessionVo = {
  id?: number
  sessionTitle?: string
  systemRole?: string
  sort?: number
  createDept?: number
  createBy?: number
  createTime?: string
  updateBy?: number
  updateTime?: string
}

export type ChatImgSessionVo = {
  id?: number
  sessionTitle?: string
  sort?: number
  createDept?: number
  createBy?: number
  createTime?: string
  updateBy?: number
  updateTime?: string
  deletedFlag?: number
}

export type ChatQaDetailsVo = { id?: number; sessionId?: number; questionMsg?: string; answerMsg?: string; sort?: number }
export type ChatImgQaDetailsVo = {
  id?: number
  sessionId?: number
  questionParams?: string
  questionMsg?: string
  answerMsg?: string
  imageUrl?: string
  sort?: number
  createDept?: number
  createBy?: number
  createTime?: string
  updateBy?: number
  updateTime?: string
  deletedFlag?: number
}

export type ChatSessionListBo = { id?: number; idList?: number[]; sessionTitle?: string; systemRole?: string; createByList?: number[] }
export type ChatImgSessionListBo = { id?: number; sessionTitle?: string }
export type ChatSessionBoEditGroup = { id: number; sessionTitle: string; systemRole?: string; sort?: number }
export type ChatImgSessionBoEditGroup = { id?: number; sessionTitle?: string; sort?: number }
export type ChatQaDetailsListBo = { id?: number; idList?: number[]; sessionId?: number; sessionIdList?: number[]; questionMsg?: string; answerMsg?: string }
export type ChatImgQaDetailsListBo = { id?: number; sessionId?: number; questionMsg?: string; answerMsg?: string }

