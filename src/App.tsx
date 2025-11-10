import React from 'react'
import { Layout, Menu } from 'antd'
import { Link, Routes, Route } from 'react-router-dom'
import Demo from './pages/Demo'

const { Header, Sider, Content } = Layout

function App() {
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
            defaultSelectedKeys={["demo"]}
            items={[{ key: 'demo', label: <Link to="/">示范页面</Link> }]} />
        </Sider>
        <Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/" element={<Demo />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
