import { useEffect, useState } from 'react'
import { Form, Input, message, Select, Image, Row, Col } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { setToken, setAuthInfo } from '@/utils/auth'
import { login, getCodeImg, getTenantList } from '@/api/login'
import { getInfo } from '@/api/system/user'
import type { TenantVO } from '@/api/types'
import './Login.css'
import bg2 from '@/assets/login/bg2.jpg'
import { EyeOutlined, EyeInvisibleOutlined, UserOutlined } from '@ant-design/icons'

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
  const [isUser, setIsUser] = useState<boolean>(true)
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false)

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
      console.log("🚀 ~ onFinish ~ e:", e)
      setLoading(false)
      // 登录失败时刷新验证码
      fetchCode()
    }
  }

  const toggleRemember = () => {
    const current = form.getFieldValue('rememberMe')
    form.setFieldsValue({ rememberMe: !current })
  }

  const changeType = () => {
    setIsUser(v => !v)
  }

  return (
    <div className="login-container">
      <div className="login-bg">
        <img src={bg2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div className="login-right">
        <div className="login-panel">
          <div className="login-content-box">
            <div className="login-title"></div>
            <div className="login-form">
              <div className="login-form-header">
                <div className="login-form-header-left"></div>
                <div className={`login-form-header-right ${!isUser ? 'active' : ''}`} onClick={changeType}>
                  <div className="acount-icon">
                    <UserOutlined style={{ fontSize: 18, color: isUser ? '#008bfb' : '#ffffff' }} />
                  </div>
                  <div className={isUser ? 'toggle-indicator' : 'activeScan'}></div>
                  <div className="circle"></div>
                </div>
              </div>
              <div className="login-form-content">
                {isUser ? (
                  <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ rememberMe: true }}>
                    {tenantEnabled ? (
                      <>
                        <div className="user-name-box">
                          <span className="user-name">租户</span>
                        </div>
                        <Form.Item name="tenantId" rules={[{ required: true, message: '请选择租户' }]}> 
                          <Select placeholder="请选择/输入公司名称" showSearch filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())} options={tenantList.map(t => ({ label: t.companyName, value: t.tenantId }))} />
                        </Form.Item>
                      </>
                    ) : (
                      <>
                        <div className="user-name-box">
                          <span className="user-name">租户ID</span>
                        </div>
                        <Form.Item name="tenantId"> 
                          <Input placeholder="如启用多租户，请填写或选择租户" />
                        </Form.Item>
                      </>
                    )}

                    <div className="user-name-box">
                      <span className="user-name">海麦工号</span>
                    </div>
                    <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}> 
                      <Input placeholder="请输入" autoComplete="username" prefix={<span className="user-icon" />} />
                    </Form.Item>

                    <div className="user-name-box">
                      <span className="user-name">登录密码</span>
                      <div className="rember-password" onClick={toggleRemember}>
                        <div className={`rember-password-icon ${form.getFieldValue('rememberMe') ? 'is-selected' : ''}`}></div>
                        <span style={{ color: '#8993a3' }}>记住密码</span>
                      </div>
                    </div>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}> 
                      <Input
                        type={passwordVisible ? 'text' : 'password'}
                        placeholder="请输入"
                        autoComplete="current-password"
                        prefix={<span className="password-icon" />}
                        suffix={
                          passwordVisible ? (
                            <EyeInvisibleOutlined className="password-toggle" onClick={() => setPasswordVisible(false)} />
                          ) : (
                            <EyeOutlined className="password-toggle" onClick={() => setPasswordVisible(true)} />
                          )
                        }
                        onPressEnter={() => form.submit()}
                      />
                    </Form.Item>

                    {captchaEnabled && (
                      <>
                        <Form.Item name="uuid" hidden>
                          <Input type="hidden" />
                        </Form.Item>
                        <div className="login-code-box">
                          <Row gutter={8} align="middle">
                            <Col flex="auto">
                              <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]}> 
                                <Input placeholder="验证码" prefix={<span className="code-icon" />} onPressEnter={() => form.submit()} />
                              </Form.Item>
                            </Col>
                            <Col>
                              {codeUrl && (
                                <div className="login-code">
                                  <Image src={codeUrl} alt="验证码" preview={false} height={40} onClick={fetchCode} className="login-code-img" />
                                </div>
                              )}
                            </Col>
                          </Row>
                        </div>
                      </>
                    )}

                    <div className={`login-btn ${loading ? 'loading' : ''}`} onClick={() => form.submit()}>
                      <span>{loading ? '登录中...' : 'Sign\u00A0In'}</span>
                    </div>
                  </Form>
                ) : (
                  <div className="dd-code-box" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8993a3' }}>
                    钉钉扫码登录（占位）
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="el-login-footer">
            <span>Copyright © 2024 广州海麦 All Rights Reserved.</span>
          </div>
        </div>
      </div>
    </div>
  )
}