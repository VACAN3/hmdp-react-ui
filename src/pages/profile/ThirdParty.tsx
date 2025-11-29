import React from 'react'
import { Alert } from 'antd'
import { useTranslation } from 'react-i18next'
import type { UserInfoVO } from '@/api/system/user'

export default function ThirdParty({ profile }: { profile: UserInfoVO | null }) {
  const { t } = useTranslation('profile')
  return (
    <div>
      <Alert message={t('thirdPartyPlaceholder')} type="success" showIcon />
    </div>
  )
}
