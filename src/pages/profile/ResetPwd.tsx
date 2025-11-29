import React, { useEffect, useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { useTranslation } from 'react-i18next'
import type { UserInfoVO } from '@/api/system/user'
import { updateUserPwd } from '@/api/system/user'

export default function ResetPwd({ profile }: { profile: UserInfoVO | null }) {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState<boolean>(false)

  const onFinish = async (values: FormValues) => {
    try {
      setLoading(true)
      const res = await updateUserPwd(values)
      message.success(t('common.updateSuccess'))
      setLoading(false)
    } catch (error) {}
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="oldPassword" label={t('profile.oldPassword')} rules={[{ required: true, message: t('profile.inputOldPassword') }]}>
        <Input placeholder={t('profile.inputOldPassword')} />
      </Form.Item>
      <Form.Item name="newPassword" label={t('profile.newPassword')} rules={[{ required: true, message: t('profile.inputNewPassword') }]}>
        <Input placeholder={t('profile.inputNewPassword')} />
      </Form.Item>
      <Form.Item name="confirmPassword" label={t('profile.confirmPassword')} rules={[{ required: true, message: t('profile.inputConfirmPassword') }]}>
        <Input placeholder={t('profile.inputConfirmPassword')} />
      </Form.Item>
      <div style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit">{t('common.save')}</Button>
      </div>
    </Form>
  )
}
