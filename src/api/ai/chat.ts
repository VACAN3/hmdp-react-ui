import { post } from '@/utils/request'
import type { Call, ChatCompletionResponse } from '@/types/ai'

export const CHAT_SSE_URL = '/chatgpt/chat/sse'
export const CHAT_SSE_IMG2TEXT_URL = '/chatgpt/chat/sse/img2Text'

export function chatSync(call: Call): Promise<ChatCompletionResponse> {
  return post<ChatCompletionResponse>('/chatgpt/chat', call)
}
