import { post } from '@/utils/request'
import service from '@/utils/request'
import type { ChatQaDetailsListBo, ChatImgQaDetailsListBo, TableDataInfo, ChatQaDetailsVo, ChatImgQaDetailsVo } from '@/types/ai'

export function qaList(params: ChatQaDetailsListBo): Promise<TableDataInfo<ChatQaDetailsVo>> {
  return post<TableDataInfo<ChatQaDetailsVo>>('/chat/qaDetail/list', params)
}

export function qaRemove(ids: number[]): Promise<void> {
  return service.delete('/chat/qaDetail/delete', { data: ids }).then(r => ((r.data as any)?.data ?? (r.data as any)))
}

export function imgQaList(params: ChatImgQaDetailsListBo): Promise<TableDataInfo<ChatImgQaDetailsVo>> {
  return post<TableDataInfo<ChatImgQaDetailsVo>>('/chat/image/qaDetail/list', params)
}

export function imgQaRemove(ids: number[]): Promise<void> {
  return service.delete('/chat/image/qaDetail/delete', { data: ids }).then(r => ((r.data as any)?.data ?? (r.data as any)))
}
