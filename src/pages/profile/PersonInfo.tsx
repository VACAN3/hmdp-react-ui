import { Card } from 'antd'
import UserAvatar from './UserAvatar'
import type { UserInfoVO } from '@/api/system/user'
import { useTranslation } from 'react-i18next'

type Props = {
  profile: UserInfoVO | null
}

export default function PersonInfo({ profile }: Props) {
  const { t } = useTranslation('profile')
  const user = profile?.user || {}
  const roleGroup = profile?.roleGroup || '—'
  const deptName = user?.dept?.deptName || '—'
  const userName = user?.userName || '—'
  const phone = user?.phonenumber || '—'
  const email = user?.email || '—'
  const createTime = (user as any)?.createTime || user?.loginDate || '—'

  return (
    <Card title={t("personInfo")}>
      <div className="text-center">
        <UserAvatar />
      </div>
      <ul className="list-group list-group-striped">
        <li className="list-group-item">
          <span>{t("userName")}</span>
          <div className="pull-right">{userName}</div>
        </li>
        <li className="list-group-item">
          <span>{t("phone")}</span>
          <div className="pull-right">{phone}</div>
        </li>
        <li className="list-group-item">
          <span>{t("email")}</span>
          <div className="pull-right">{email}</div>
        </li>
        <li className="list-group-item">
          <span>{t("deptName")}</span>
          <div className="pull-right">{deptName}</div>
        </li>
        <li className="list-group-item">
          <span>{t("roleGroup")}</span>
          <div className="pull-right">{roleGroup}</div>
        </li>
        <li className="list-group-item">
          <span>{t("createTime")}</span>
          <div className="pull-right">{createTime}</div>
        </li>
      </ul>
    </Card>
  )
}
