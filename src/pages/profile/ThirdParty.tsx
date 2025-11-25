import React from 'react'
import { Alert } from 'antd'
import type { UserInfoVO } from '@/api/system/user'

export default function ThirdParty({ profile }: { profile: UserInfoVO | null }) {
  return (
    <div>
      <Alert message="第三方应用占位：请接入授权列表与绑定/解绑" type="success" showIcon />
    </div>
  )
}
