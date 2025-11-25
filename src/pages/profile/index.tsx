import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Tabs, message, Spin } from 'antd'
import PersonInfo from './PersonInfo'
import UserInfo from './UserInfo'
import ResetPwd from './ResetPwd'
import ThirdParty from './ThirdParty'
import './index.css'
import { getUserProfile } from '@/api/system/user'
import type { UserInfoVO } from '@/api/system/user'

export default function Profile() {
  const [loading, setLoading] = useState<boolean>(false)
  const [profile, setProfile] = useState<UserInfoVO | null>(null)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await getUserProfile()
        setProfile(data)
      } catch (e: any) {
        message.error(e?.message || '获取用户资料失败')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const items = [
    { key: 'userinfo', label: '基本资料', children: <UserInfo profile={profile} /> },
    { key: 'resetPwd', label: '修改密码', children: <ResetPwd profile={profile} /> },
    { key: 'thirdParty', label: '第三方应用', children: <ThirdParty profile={profile} /> },
  ]

  return (
    <div className="profile-page">
      <Row gutter={20}>
        <Col span={12}>
          <PersonInfo profile={profile} />
        </Col>
        <Col span={12}>
          <Card title="基本资料">
            <Spin spinning={loading}>
              <Tabs defaultActiveKey="userinfo" items={items} />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

