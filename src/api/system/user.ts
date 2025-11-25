import { get, put } from '@/utils/request'
import type { UserInfo as BasicUserInfo } from '@/api/types'

// 参考 hmdp-ui 的类型结构，做精简版本以满足个人中心数据展示
export type DeptVO = {
  deptId?: number
  deptName?: string
  parentId?: number
}

export type RoleVO = {
  roleId?: string | number
  roleName?: string
}

export type PostVO = {
  postId?: string | number
  postName?: string
}

export type UserVO = {
  userId?: string | number
  deptId?: number
  userName?: string
  nickName?: string
  userType?: string
  email?: string
  phonenumber?: string
  sex?: string
  avatar?: string | null
  status?: string
  delFlag?: string
  loginIp?: string
  loginDate?: string
  remark?: string
  dept?: DeptVO
  roles?: RoleVO[]
}

export type UserInfoVO = {
  user: UserVO
  roles?: RoleVO[]
  roleIds?: (string | number)[]
  posts?: PostVO[]
  postIds?: (string | number)[]
  roleGroup?: string
  postGroup?: string
}

// 登录后获取的基础用户信息（角色、权限等）
export function getInfo(): Promise<BasicUserInfo> {
  return get<BasicUserInfo>('/system/user/getInfo')
}

// 个人中心-用户资料
export function getUserProfile(): Promise<UserInfoVO> {
  return get<UserInfoVO>('/system/user/profile')
}

// 修改密码
export function updateUserPwd(data) {
  return put('/system/user/profile/updatePwd', data)
}

export default {
  getInfo,
  getUserProfile,
}

