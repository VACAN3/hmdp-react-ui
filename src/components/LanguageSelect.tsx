import React, { useMemo } from 'react'
import { Dropdown, Space } from 'antd'
import { GlobalOutlined, CheckOutlined } from '@ant-design/icons'
import { useLayout } from '@/layouts/LayoutContext'
import i18n from '@/i18n'

const LanguageSelect: React.FC = () => {
  const { settings, setLanguage } = useLayout()

  const items = useMemo(() => ([
    {
      key: 'zh-CN',
      label: (
        <Space>
          {settings.language === 'zh-CN' && <CheckOutlined />}
          简体中文
        </Space>
      ),
    },
    {
      key: 'en-US',
      label: (
        <Space>
          {settings.language === 'en-US' && <CheckOutlined />}
          English
        </Space>
      ),
    },
  ]), [settings.language])

  const onClick: NonNullable<React.ComponentProps<typeof Dropdown>['menu']>['onClick'] = ({ key }) => {
    const nextLang = key as 'zh-CN' | 'en-US'
    setLanguage(nextLang)
    i18n.changeLanguage(nextLang)
  }

  return (
    <Dropdown
      trigger={["click"]}
      menu={{ items, onClick }}
    >
      <Space style={{ cursor: 'pointer' }}>
        <GlobalOutlined />
      </Space>
    </Dropdown>
  )
}

export default LanguageSelect

