import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { message } from 'antd'
import './i18n'
import 'antd/dist/reset.css'
import './index.css'

const queryClient = new QueryClient()
// 全局 message 配置，提升出现位置与并发数量
message.config({ top: 16, maxCount: 3, duration: 2 })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={(import.meta.env.VITE_APP_CONTEXT_PATH || '/').replace(/\\\/$/, '')}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
