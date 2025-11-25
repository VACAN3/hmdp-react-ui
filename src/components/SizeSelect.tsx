import React from 'react'
import { Dropdown, Space } from 'antd'
import { FontSizeOutlined, DownOutlined } from '@ant-design/icons'
import { useLayout } from '@/layouts/LayoutContext'
import { useTranslation } from 'react-i18next'

export default function SizeSelect() {
  const { settings, setComponentSize } = useLayout()
  const { t } = useTranslation()

  const items = [
    { key: 'large',  label: <span style={{ opacity: settings.componentSize === 'large'  ? 0.5 : 1 }}>{t('sizeSelect.large')}</span> },
    { key: 'middle', label: <span style={{ opacity: settings.componentSize === 'middle' ? 0.5 : 1 }}>{t('sizeSelect.middle')}</span> },
    { key: 'small',  label: <span style={{ opacity: settings.componentSize === 'small'  ? 0.5 : 1 }}>{t('sizeSelect.small')}</span> },
  ]

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => setComponentSize(key as any),
      }}
      trigger={["click"]}
    >
      <Space style={{ cursor: 'pointer' }} title={t('navbar.size')}>
        <FontSizeOutlined />
        <DownOutlined />
      </Space>
    </Dropdown>
  )
}
