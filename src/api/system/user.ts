import { get } from '@/utils/request'
import type { UserInfo } from '@/api/types'

export function getInfo(): Promise<UserInfo> {
  return get<UserInfo>('/system/user/getInfo')
}