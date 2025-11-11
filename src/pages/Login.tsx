import React, { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Typography, Space, Checkbox, message, Select, Image, Row, Col } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { setToken, setAuthInfo } from '@/utils/auth'
import { login, getCodeImg, getTenantList } from '@/api/login'
import { getInfo } from '@/api/system/user'
import type { TenantVO } from '@/api/types'

type LoginFormValues = {
  username: string
  password: string
  tenantId?: string
  rememberMe?: boolean
  code?: string
  uuid?: string
}

export default function Login() {
  const [form] = Form.useForm<LoginFormValues>()
  const navigate = useNavigate()
  const location = useLocation() as any

  const clientId = (import.meta.env.VITE_APP_CLIENT_ID || 'hmdp-ui') as string
  const [captchaEnabled, setCaptchaEnabled] = useState<boolean>(true)
  const [tenantEnabled, setTenantEnabled] = useState<boolean>(false)
  const [codeUrl, setCodeUrl] = useState<string>('')
  const [tenantList, setTenantList] = useState<TenantVO[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const fetchCode = async () => {
    try {
      const data = await getCodeImg()
      const enabled = data?.captchaEnabled === undefined ? true : data?.captchaEnabled
      setCaptchaEnabled(enabled)
      if (enabled) {
        setCodeUrl(`data:image/gif;base64,${data?.img ?? ''}`)
        form.setFieldsValue({ uuid: data?.uuid })
      }
    } catch {
      // 验证码获取失败时关闭验证码
      setCaptchaEnabled(false)
    }
  }

  const fetchTenantList = async () => {
    try {
      const data = await getTenantList()
      const enabled = (data as any)?.tenantEnabled === undefined ? true : (data as any)?.tenantEnabled
      setTenantEnabled(enabled)
      if (enabled) {
        const list = (data as any)?.voList ?? []
        setTenantList(list)
        if (list.length > 0) {
          form.setFieldsValue({ tenantId: list[0].tenantId })
        }
      }
    } catch {
      setTenantEnabled(false)
    }
  }

  const restoreForm = () => {
    const tenantId = localStorage.getItem('tenantId')
    const username = localStorage.getItem('username')
    const password = localStorage.getItem('password')
    const rememberMe = localStorage.getItem('rememberMe')
    form.setFieldsValue({
      tenantId: tenantId ?? undefined,
      username: username ?? '',
      password: password ?? '',
      rememberMe: rememberMe ? rememberMe === 'true' : false,
    })
  }

  useEffect(() => {
    // 清理旧 token，初始化验证码与租户数据并恢复本地记忆
    localStorage.removeItem('oldAdminToken')
    localStorage.removeItem('User-Token')
    fetchCode()
    fetchTenantList()
    restoreForm()
  }, [])

  const onFinish = async (values: LoginFormValues) => {
    try {
      setLoading(true)
      if (values.rememberMe) {
        localStorage.setItem('tenantId', String(values.tenantId ?? ''))
        localStorage.setItem('username', String(values.username ?? ''))
        localStorage.setItem('password', String(values.password ?? ''))
        localStorage.setItem('rememberMe', String(values.rememberMe ?? false))
      } else {
        localStorage.removeItem('tenantId')
        localStorage.removeItem('username')
        localStorage.removeItem('password')
        localStorage.removeItem('rememberMe')
      }
      const res = await login({
        ...values,
        clientId,
        grantType: 'password',
      } as any)
      const accessToken = (res as any)?.access_token || (res as any)?.data?.access_token
      if (!accessToken) throw new Error('登录响应缺少 access_token')

      setToken(accessToken)

      // 拉取用户信息，保存角色与权限
      try {
        const info = await getInfo()
        const roles: string[] = (info as any)?.roles ?? []
        const perms: string[] = (info as any)?.permissions ?? []
        setAuthInfo(roles, perms)
      } catch {
        // 忽略 getInfo 错误，至少完成登录
      }

      message.success('登录成功')
      const to = location.state?.from?.pathname || '/'
      navigate(to, { replace: true })
      setLoading(false)
    } catch (e: any) {
      setLoading(false)
      // 登录失败时刷新验证码
      fetchCode()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', position: 'relative' }}>
      {/* 简单装饰效果 */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(15)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: -70, left: `${Math.random() * 100}%`, width: 160, height: 70, background: 'linear-gradient(to bottom, #4a90e2 0%, #357abd 100%)', border: '1px solid #2d6da3', borderRadius: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.2)', opacity: 0.2 }} />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Card title="登录" style={{ width: 420 }}>
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ rememberMe: true }}>
            {tenantEnabled ? (
              <Form.Item name="tenantId" label="租户" rules={[{ required: true, message: '请选择租户' }]}> 
                <Select placeholder="请选择/输入公司名称" showSearch filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())} options={tenantList.map(t => ({ label: t.companyName, value: t.tenantId }))} />
              </Form.Item>
            ) : (
              <Form.Item name="tenantId" label="租户ID" tooltip="如系统启用多租户，请填写或选择租户" >
                <Input placeholder="可选：租户ID" />
              </Form.Item>
            )}
            <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}> 
              <Input placeholder="用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}> 
              <Input.Password placeholder="密码" autoComplete="current-password" />
            </Form.Item>

            {captchaEnabled && (
              <>
                <Form.Item name="uuid" hidden>
                  <Input type="hidden" />
                </Form.Item>
                <Row gutter={8} align="middle">
                  <Col flex="auto">
                    <Form.Item name="code" label="验证码" rules={[{ required: true, message: '请输入验证码' }]}> 
                      <Input placeholder="验证码" />
                    </Form.Item>
                  </Col>
                  <Col>
                    {codeUrl && (
                      <Image src={codeUrl} alt="验证码" preview={false} height={40} onClick={fetchCode} style={{ cursor: 'pointer', marginTop: 28 }} />
                    )}
                  </Col>
                </Row>
              </>
            )}

            <Form.Item name="rememberMe" valuePropName="checked">
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Typography.Link href="#">忘记密码?</Typography.Link>
              <Button type="primary" htmlType="submit" loading={loading}>登录</Button>
            </Space>
          </Form>
        </Card>
      </div>
    </div>
  )
}