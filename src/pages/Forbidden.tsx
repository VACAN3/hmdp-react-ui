import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Forbidden() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Result
      status="403"
      title="403"
      subTitle={t('common.forbiddenMessage')}
      extra={<Button type="primary" onClick={() => navigate('/')}>{t('common.backHome')}</Button>}
    />
  )
}