import React from 'react'
import { Layout, Menu } from 'antd'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { routes, buildMenuFromRoutes } from '@/router/routes'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const location = useLocation()
  const menuTree = buildMenuFromRoutes(routes)

  const toAntdItems = (nodes: typeof menuTree): NonNullable<React.ComponentProps<typeof Menu>['items']> => {
    const mapNode = (n: (typeof menuTree)[number]): NonNullable<React.ComponentProps<typeof Menu>['items']>[number] => ({
      key: n.path,
      label: <Link to={n.path}>{n.title}</Link>,
      icon: n.icon,
      children: n.children?.map(mapNode),
    })
    return nodes.map(mapNode)
  }

  const menuItems = toAntdItems(menuTree)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 600 }}>HMDP React</div>
      </Header>
      <Layout>
        <Sider width={200} theme="dark">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
          />
        </Sider>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}