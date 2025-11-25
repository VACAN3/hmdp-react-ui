import React from 'react'
import { Avatar, Button, Space } from 'antd'
import { UserOutlined } from '@ant-design/icons'

export default function UserAvatar() {
  return (
    <div>
      <Space direction="vertical" align="center">
        <Avatar size={96} icon={<UserOutlined />} />
        <Button size="small" type="primary" disabled>
          修改头像（占位）
        </Button>
      </Space>
    </div>
  )
}

