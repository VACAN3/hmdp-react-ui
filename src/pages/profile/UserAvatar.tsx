import React from 'react'
import { Avatar, Button, Space } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

export default function UserAvatar() {
  const { t } = useTranslation('profile')
  return (
    <div>
      <Space direction="vertical" align="center">
        <Avatar size={96} icon={<UserOutlined />} />
        <Button size="small" type="primary" disabled>
          {t('changeAvatarPlaceholder')}
        </Button>
      </Space>
    </div>
  )
}

