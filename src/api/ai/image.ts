import { post } from '@/utils/request'
import type { ImageGenerationCall, ChatImgQaDetailsVo } from '@/types/ai'

export function imageGeneration(payload: ImageGenerationCall): Promise<ChatImgQaDetailsVo> {
  return post<ChatImgQaDetailsVo>('/chatgpt/chat/img/generation', payload)
}
