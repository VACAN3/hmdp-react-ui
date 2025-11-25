import React from 'react'
import { Dropdown, Space } from 'antd'
import { FontSizeOutlined, DownOutlined } from '@ant-design/icons'
import { useLayout } from '@/layouts/LayoutContext'

const options = [
  { label: '较大', value: 'large' },
  { label: '默认', value: 'middle' },
  { label: '稍小', value: 'small' },
] as const

export default function SizeSelect() {
  const { settings, setComponentSize } = useLayout()
  const items = options.map(opt => ({
    key: opt.value,
    label: (
      <span style={{ opacity: settings.componentSize === opt.value ? 0.5 : 1 }}>{opt.label}</span>
    )
  }))

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => setComponentSize(key as any),
      }}
      trigger={["click"]}
    >
      <Space style={{ cursor: 'pointer' }}>
        <FontSizeOutlined />
        <DownOutlined />
      </Space>
    </Dropdown>
  )
}

