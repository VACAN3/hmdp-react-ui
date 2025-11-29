import React from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { Menu, Dropdown, Avatar, Space, Modal, message, ConfigProvider } from 'antd'
import { UserOutlined, DownOutlined, SettingOutlined, LogoutOutlined, SwapOutlined, ProfileOutlined, CloudDownloadOutlined } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import SizeSelect from '@/components/SizeSelect'
import LanguageSelect from '@/components/LanguageSelect'
import { routes, buildMenuFromRoutes } from '@/router/routes'
import { LayoutProvider, useLayout } from './LayoutContext'
import TagsView from './components/TagsView'
import { usePermission } from '@/hooks/usePermission'
import { logout as apiLogout } from '@/api/login'
import { removeToken } from '@/utils/auth'
import { useTranslation } from 'react-i18next'
import './layout.css'

function Sidebar() {
  const location = useLocation()
  const menuTree = buildMenuFromRoutes(routes)
  const { sidebar } = useLayout()
  const { t } = useTranslation()

  const toItems = (nodes: typeof menuTree): NonNullable<React.ComponentProps<typeof Menu>['items']> => {
    const mapNode = (n: (typeof menuTree)[number]): NonNullable<React.ComponentProps<typeof Menu>['items']>[number] => ({
      key: n.path,
      label: <Link to={n.path}>{t(n.title)}</Link>, // 重点，配合路由title变量动态适配
      icon: n.icon,
      children: n.children?.map(mapNode),
    })
    return nodes.map(mapNode)
  }
  return (
    <div className={`sidebar-container ${sidebar.opened ? 'open' : 'closed'}`}>
      <Menu
        theme="dark"
        mode="inline"
        inlineCollapsed={!sidebar.opened}
        selectedKeys={[location.pathname]}
        items={toItems(menuTree)}
      />
    </div>
  )
}

function Navbar() {
  const { sidebar, openSideBar, closeSideBar, toggleSideBarHide, settings, setFixedHeader, setTagsView } = useLayout()
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const toggleOpen = () => (sidebar.opened ? closeSideBar({ withoutAnimation: false }) : openSideBar({ withoutAnimation: false }))
  const jumpDownloadCenter = () => {
    navigate('/download-center')
  }
  const onMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        navigate('/profile')
        break
      case 'layout':
        message.info(t('settings.placeholder'))
        break
      case 'changeAccount':
        navigate('/login')
        break
      case 'logout':
        Modal.confirm({
          title: t('system.tip'),
          content: t('system.confirmLogout'),
          okText: t('common.confirm'),
          cancelText: t('common.cancel'),
          onOk: async () => {
            try {
              await apiLogout()
            } catch (error) {
              console.log('error', error)
            }
            removeToken()
            message.success(t('system.logoutSuccess'))
            navigate('/login', { replace: true })
          },
        })
        break
      default:
        break
    }
  }

  const dropdownItems: NonNullable<React.ComponentProps<typeof Dropdown>['menu']>['items'] = [
    { key: 'profile', label: t('navbar.profile'), icon: <ProfileOutlined /> },
    { key: 'layout', label: t('navbar.layoutSettings'), icon: <SettingOutlined /> },
    hasPermission('auth:user:change') ? { key: 'changeAccount', label: t('navbar.changeAccount'), icon: <SwapOutlined /> } : null,
    { type: 'divider' as const },
    { key: 'logout', label: t('navbar.logout'), icon: <LogoutOutlined /> },
  ].filter(Boolean) as any
  
  return (
    <div className="navbar">
      <button className="nav-btn" onClick={toggleOpen} title={t('navbar.toggleSidebar')}>☰</button>
      <div className="nav-spacer" />
      <button className="nav-btn" onClick={jumpDownloadCenter} title={t('navbar.downloadCenter')}><CloudDownloadOutlined /></button>
      <button className="nav-btn" onClick={() => toggleSideBarHide()} title={t('navbar.hideSidebar')}>⤢</button>
      <button className="nav-btn" onClick={() => setFixedHeader(!settings.fixedHeader)} title={t('navbar.fixedHeader')}>Hdr</button>
      <button className="nav-btn" onClick={() => setTagsView(!settings.tagsView)} title={t('navbar.tagsView')}>Tags</button>
      <div style={{ marginLeft: 8 }}>
        <SizeSelect />
      </div>
      <div style={{ marginLeft: 8 }}>
        <LanguageSelect />
      </div>
      <Dropdown menu={{ items: dropdownItems, onClick: onMenuClick }} trigger={["click"]}>
        <Space style={{ cursor: 'pointer', marginLeft: 8 }}>
          <Avatar size={32} icon={<UserOutlined />} />
          <DownOutlined />
        </Space>
      </Dropdown>
    </div>
  )
}

function Settings() {
  const { t } = useTranslation()
  return <div className="settings">{t('settings.placeholder')}</div>
}

function LayoutShell() {
  const { device, sidebar, settings, closeSideBar } = useLayout()
  const classObj = [
    'app-wrapper app-wrapper-box',
    !sidebar.opened ? 'hideSidebar' : 'openSidebar',
    sidebar.withoutAnimation ? 'withoutAnimation' : '',
    device === 'mobile' ? 'mobile' : '',
  ].join(' ')
  return (
    <ConfigProvider componentSize={settings.componentSize} locale={settings.language === 'zh-CN' ? zhCN : enUS}>
      <div className={classObj} style={{ ['--current-color' as any]: settings.theme }}>
        {device === 'mobile' && sidebar.opened && (
          <div className="drawer-bg" onClick={() => closeSideBar({ withoutAnimation: false })} />
        )}
        {!sidebar.hide && <Sidebar />}
        <div className={`main-container ${settings.tagsView ? 'hasTagsView' : ''} ${sidebar.hide ? 'sidebarHide' : ''}`}>
          <div className={settings.fixedHeader ? 'fixed-header' : ''}>
            <Navbar />
            {settings.tagsView && <TagsView />}
          </div>
          <div className="app-main"><Outlet /></div>
          {/* 主题颜色设置抽屉 */}
          <Settings />
        </div>
      </div>
    </ConfigProvider>
  )
}

export default function MainLayout() {
  return (
    <LayoutProvider>
      <LayoutShell />
    </LayoutProvider>
  )
}
