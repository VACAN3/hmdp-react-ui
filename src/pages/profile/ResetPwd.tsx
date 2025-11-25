import React, { useEffect, useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import type { UserInfoVO } from '@/api/system/user'
import { updateUserPwd } from '@/api/system/user'

export default function ResetPwd({ profile }: { profile: UserInfoVO | null }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState<boolean>(false)

  const onFinish = async (values: FormValues) => {
    try {
      setLoading(true)
      const res = await updateUserPwd(values)
      message.success('修改成功')
      setLoading(false)
    } catch (error) {}
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
        <Input placeholder="请输入旧密码" />
      </Form.Item>
      <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
        <Input placeholder="请输入新密码" />
      </Form.Item>
      <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请确认密码' }]}>
        <Input placeholder="请确认密码" />
      </Form.Item>
      <div style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit">保存</Button>
      </div>
    </Form>
  )
}
