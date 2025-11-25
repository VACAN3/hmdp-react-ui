import React from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { Menu, Dropdown, Avatar, Space, Modal, message, ConfigProvider } from 'antd'
import { UserOutlined, DownOutlined, SettingOutlined, LogoutOutlined, SwapOutlined, ProfileOutlined } from '@ant-design/icons'
import SizeSelect from '@/components/SizeSelect'
import { routes, buildMenuFromRoutes } from '@/router/routes'
import { LayoutProvider, useLayout } from './LayoutContext'
import { usePermission } from '@/hooks/usePermission'
import { logout as apiLogout } from '@/api/login'
import { removeToken } from '@/utils/auth'
import './layout.css'

function Sidebar() {
  const location = useLocation()
  const menuTree = buildMenuFromRoutes(routes)
  const { sidebar } = useLayout()
  const toItems = (nodes: typeof menuTree): NonNullable<React.ComponentProps<typeof Menu>['items']> => {
    const mapNode = (n: (typeof menuTree)[number]): NonNullable<React.ComponentProps<typeof Menu>['items']>[number] => ({
      key: n.path,
      label: <Link to={n.path}>{n.title}</Link>,
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
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const toggleOpen = () => (sidebar.opened ? closeSideBar({ withoutAnimation: false }) : openSideBar({ withoutAnimation: false }))

  const onMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        navigate('/profile')
        break
      case 'layout':
        message.info('布局设置占位（可接入 Settings 抽屉）')
        break
      case 'changeAccount':
        navigate('/login')
        break
      case 'logout':
        Modal.confirm({
          title: '提示',
          content: '确定注销并退出系统吗？',
          okText: '确定',
          cancelText: '取消',
          onOk: async () => {
            try {
              await apiLogout()
            } catch {}
            removeToken()
            message.success('已退出登录')
            navigate('/login', { replace: true })
          },
        })
        break
      default:
        break
    }
  }

  const dropdownItems: NonNullable<React.ComponentProps<typeof Dropdown>['menu']>['items'] = [
    { key: 'profile', label: '个人中心', icon: <ProfileOutlined /> },
    { key: 'layout', label: '布局设置', icon: <SettingOutlined /> },
    hasPermission('auth:user:change') ? { key: 'changeAccount', label: '切换账号', icon: <SwapOutlined /> } : null,
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined /> },
  ].filter(Boolean) as any
  
  return (
    <div className="navbar">
      <button className="nav-btn" onClick={toggleOpen} title="切换侧栏">☰</button>
      <div className="nav-spacer" />
      <button className="nav-btn" onClick={() => toggleSideBarHide()} title="隐藏侧栏">⤢</button>
      <button className="nav-btn" onClick={() => setFixedHeader(!settings.fixedHeader)} title="固定头部">Hdr</button>
      <button className="nav-btn" onClick={() => setTagsView(!settings.tagsView)} title="标签视图">Tags</button>
      <div style={{ marginLeft: 8 }}>
        <SizeSelect />
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

function TagsView() {
  return <div className="tags-view">TagsView 占位</div>
}

function Settings() {
  return <div className="settings">Settings 占位</div>
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
    <ConfigProvider componentSize={settings.componentSize}>
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
