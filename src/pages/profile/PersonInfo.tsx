import { Card } from 'antd'
import UserAvatar from './UserAvatar'
import type { UserInfoVO } from '@/api/system/user'

type Props = {
  profile: UserInfoVO | null
}

export default function PersonInfo({ profile }: Props) {
  const user = profile?.user || {}
  const roleGroup = profile?.roleGroup || '—'
  const deptName = user?.dept?.deptName || '—'
  const userName = user?.userName || '—'
  const phone = user?.phonenumber || '—'
  const email = user?.email || '—'
  const createTime = (user as any)?.createTime || user?.loginDate || '—'

  return (
    <Card title="个人信息">
      <div className="text-center">
        <UserAvatar />
      </div>
      <ul className="list-group list-group-striped">
        <li className="list-group-item">
          <span>用户名称</span>
          <div className="pull-right">{userName}</div>
        </li>
        <li className="list-group-item">
          <span>手机号码</span>
          <div className="pull-right">{phone}</div>
        </li>
        <li className="list-group-item">
          <span>用户邮箱</span>
          <div className="pull-right">{email}</div>
        </li>
        <li className="list-group-item">
          <span>所属部门</span>
          <div className="pull-right">{deptName}</div>
        </li>
        <li className="list-group-item">
          <span>所属角色</span>
          <div className="pull-right">{roleGroup}</div>
        </li>
        <li className="list-group-item">
          <span>创建日期</span>
          <div className="pull-right">{createTime}</div>
        </li>
      </ul>
    </Card>
  )
}
