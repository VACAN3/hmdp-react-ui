import { useEffect, useState } from 'react'
import { Form, Input, message, Select, Image, Row, Col } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setToken, setAuthInfo } from '@/utils/auth'
import { login, getCodeImg, getTenantList } from '@/api/login'
import { getInfo } from '@/api/system/user'
import type { TenantVO } from '@/api/types'
import './Login.css'
import bg2 from '@/assets/login/bg2.jpg'
import { EyeOutlined, EyeInvisibleOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

type LoginFormValues = {
  username: string
  password: string
  tenantId?: string
  rememberMe?: boolean
  code?: string
  uuid?: string
}

export default function Login() {
  const { t } = useTranslation('common')
  const [form] = Form.useForm<LoginFormValues>()
  const navigate = useNavigate()
  const location = useLocation() as any

  const clientId = (import.meta.env.VITE_APP_CLIENT_ID || 'hmdp-ui') as string
  const [loading, setLoading] = useState<boolean>(false)
  const [isUser, setIsUser] = useState<boolean>(true)
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false)

  // 1. 获取验证码
  const { data: codeData, refetch: refetchCode } = useQuery({
    queryKey: ['login', 'captcha'],
    queryFn: getCodeImg,
    refetchOnWindowFocus: false,
    retry: false,
    gcTime: 0, // 不缓存验证码，每次卸载重进都拉新的
  })

  // 2. 获取租户列表
  const { data: tenantData } = useQuery({
    queryKey: ['login', 'tenants'],
    queryFn: getTenantList,
    staleTime: 1000 * 60 * 5, // 5分钟缓存
    retry: false,
  })

  // 衍生状态
  const captchaEnabled = codeData?.captchaEnabled === undefined ? true : codeData?.captchaEnabled
  const codeUrl = captchaEnabled && codeData?.img ? `data:image/gif;base64,${codeData.img}` : ''
  
  const tenantEnabled = tenantData?.tenantEnabled === undefined ? true : tenantData?.tenantEnabled
  const tenantList = tenantEnabled ? (tenantData?.voList ?? []) : []

  // 副作用：同步验证码 UUID 到表单
  useEffect(() => {
    if (captchaEnabled && codeData?.uuid) {
      form.setFieldsValue({ uuid: codeData.uuid })
    }
  }, [codeData, captchaEnabled, form])

  // 副作用：同步默认租户到表单
  useEffect(() => {
    if (tenantList.length > 0 && !form.getFieldValue('tenantId')) {
      // 只有当表单没值时才设置默认值，避免覆盖用户手动选择
      form.setFieldsValue({ tenantId: tenantList[0].tenantId })
    }
  }, [tenantList, form])

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
    // 清理旧 token
    localStorage.removeItem('oldAdminToken')
    localStorage.removeItem('User-Token')
    // 恢复表单记忆
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
      if (!accessToken) throw new Error(t('login.missingAccessToken'))

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

      message.success(t('login.loginSuccess'))
      const to = location.state?.from?.pathname || '/'
      navigate(to, { replace: true })
      setLoading(false)
    } catch (e: any) {
      console.log("🚀 ~ onFinish ~ e:", e)
      setLoading(false)
      // 登录失败时刷新验证码
      refetchCode()
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
                          <span className="user-name">{t('login.tenant')}</span>
                        </div>
                        <Form.Item name="tenantId" rules={[{ required: true, message: t('login.selectTenant') }]}> 
                          <Select placeholder={t('login.tenantPlaceholder')} showSearch filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())} options={tenantList.map(t => ({ label: t.companyName, value: t.tenantId }))} />
                        </Form.Item>
                      </>
                    ) : (
                      <>
                        <div className="user-name-box">
                          <span className="user-name">{t('login.tenantId')}</span>
                        </div>
                        <Form.Item name="tenantId"> 
                          <Input placeholder={t('login.tenantIdPlaceholder')} />
                        </Form.Item>
                      </>
                    )}

                    <div className="user-name-box">
                      <span className="user-name">{t('login.username')}</span>
                    </div>
                    <Form.Item name="username" rules={[{ required: true, message: t('login.inputUsername') }]}> 
                      <Input placeholder={t('common.input')} autoComplete="username" prefix={<span className="user-icon" />} />
                    </Form.Item>

                    <div className="user-name-box">
                      <span className="user-name">{t('login.password')}</span>
                      <div className="rember-password" onClick={toggleRemember}>
                        <div className={`rember-password-icon ${form.getFieldValue('rememberMe') ? 'is-selected' : ''}`}></div>
                        <span style={{ color: '#8993a3' }}>{t('login.rememberMe')}</span>
                      </div>
                    </div>
                    <Form.Item name="password" rules={[{ required: true, message: t('login.inputPassword') }]}> 
                      <Input
                        type={passwordVisible ? 'text' : 'password'}
                        placeholder={t('common.input')}
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
                              <Form.Item name="code" rules={[{ required: true, message: t('login.inputCaptcha') }]}> 
                                <Input placeholder={t('login.captcha')} prefix={<span className="code-icon" />} onPressEnter={() => form.submit()} />
                              </Form.Item>
                            </Col>
                            <Col>
                              {codeUrl && (
                                <div className="login-code">
                                  <Image src={codeUrl} alt={t('login.captcha')} preview={false} height={40} onClick={() => refetchCode()} className="login-code-img" />
                                </div>
                              )}
                            </Col>
                          </Row>
                        </div>
                      </>
                    )}

                    <div className={`login-btn ${loading ? 'loading' : ''}`} onClick={() => form.submit()}>
                      <span>{loading ? t('login.loggingIn') : t('login.signIn')}</span>
                    </div>
                  </Form>
                ) : (
                  <div className="dd-code-box" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8993a3' }}>
                    {t('login.dingTalkPlaceholder')}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="el-login-footer">
            <span>{t('login.copyright')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}