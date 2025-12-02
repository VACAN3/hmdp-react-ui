import { get, post } from '@/utils/request'
import service from '@/utils/request'
import type {
  ChatSessionListBo,
  ChatSessionBoEditGroup,
  ChatImgSessionListBo,
  ChatImgSessionBoEditGroup,
  ChatSessionVo,
  ChatImgSessionVo,
  TableDataInfo,
} from '@/types/ai'

export function getTempId(): Promise<number> {
  return get<number>('/chat/session/getTempId')
}

export function list(params: ChatSessionListBo): Promise<TableDataInfo<ChatSessionVo>> {
  return post<TableDataInfo<ChatSessionVo>>('/chat/session/list', params)
}

export function edit(payload: ChatSessionBoEditGroup): Promise<void> {
  return post<void>('/chat/session/edit', payload)
}

export function remove(ids: number[]): Promise<void> {
  return service.delete('/chat/session/delete', { data: ids }).then(r => ((r.data as any)?.data ?? (r.data as any)))
}

export function imgGetTempId(): Promise<number> {
  return get<number>('/chat/image/session/getTempId')
}

export function imgList(params: ChatImgSessionListBo): Promise<TableDataInfo<ChatImgSessionVo>> {
  return post<TableDataInfo<ChatImgSessionVo>>('/chat/image/session/list', params)
}

export function imgEdit(payload: ChatImgSessionBoEditGroup): Promise<void> {
  return post<void>('/chat/image/session/edit', payload)
}

export function imgRemove(ids: number[]): Promise<void> {
  return service.delete('/chat/image/session/delete', { data: ids }).then(r => ((r.data as any)?.data ?? (r.data as any)))
}
