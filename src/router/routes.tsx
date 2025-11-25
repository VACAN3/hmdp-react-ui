import React from 'react'
import type { RouteObject } from 'react-router-dom'
import Demo from '../pages/Demo'
import Login from '@/pages/Login'
import Forbidden from '@/pages/Forbidden'
import RequireAuth from '@/components/RequireAuth'
import MainLayout from '@/layouts/MainLayout'
import Profile from '@/pages/profile'

export interface RouteMeta {
  title?: string
  auth?: boolean
  icon?: React.ReactNode
  hideInMenu?: boolean
  activeMenu?: string
  noCache?: boolean
  breadcrumb?: boolean
  affix?: boolean
  order?: number
  permissions?: string[]
  roles?: string[]
}

export interface AppRouteObject extends RouteObject {
  name?: string
  meta?: RouteMeta
  children?: AppRouteObject[]
}

// 根据 hmdp-ui 的路由思想进行初始化：保留 meta 信息（如 title、auth）
// 后续可继续补充更多业务页面，仅示范将 Demo 页面挂载到菜单与路由中
export const routes: AppRouteObject[] = [
  // 顶层独立页面（不参与主布局）
  {
    path: '/login',
    name: 'Login',
    element: <Login />,
    meta: { title: '登录', auth: false, hideInMenu: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    element: <Forbidden />,
    meta: { title: '无权限', auth: false, hideInMenu: true },
  },
  // 主布局路由，子页面在此之下
  {
    path: '/',
    element: <MainLayout />,
    meta: { hideInMenu: true },
    children: [
      {
        index: true,
        name: 'Home',
        element: <Demo />,
        meta: { title: '示范页面', auth: true, affix: true },
      },
      {
        path: 'profile',
        name: 'Profile',
        element: <Profile />,
        meta: { title: '个人中心', auth: true, hideInMenu: true },
      },
    ],
  },
]

// 菜单节点结构（用于生成 Antd Menu 项）
export type MenuNode = {
  key: string
  title: string
  path: string
  icon?: React.ReactNode
  children?: MenuNode[]
}

// 从路由（含 meta）推导菜单树
export function buildMenuFromRoutes(rs: AppRouteObject[]): MenuNode[] {
  const build = (list: AppRouteObject[], parentPath = ''): MenuNode[] => {
    const result: MenuNode[] = []
    for (const r of (list || [])) {
      const path = normalizePath(parentPath, r.path)
      const children = r.children ? build(r.children, path) : undefined
      if (r.meta?.hideInMenu) {
        // 隐藏节点不生成菜单项，但提升其子节点到同级
        if (children) result.push(...children)
        continue
      }
      result.push({
        key: r.name || path || '',
        title: r.meta?.title || r.name || path || '',
        path,
        icon: r.meta?.icon,
        children,
      })
    }
    return result.sort((a, b) => (getOrder(a.key, rs) - getOrder(b.key, rs)))
  }
  return build(rs)
}

function normalizePath(parent: string | undefined, child: string | undefined): string {
  const p = (parent || '').replace(/\/$/, '')
  const c = (child || '').replace(/^\//, '')
  if (!c) return p || '/'
  return `${p}/${c}`.replace(/\/+/, '/')
}

function getOrder(key: string, rs: AppRouteObject[]): number {
  // 简单根据 meta.order 排序；无则返回较大值
  const find = (list: AppRouteObject[]): number | undefined => {
    for (const r of list) {
      const k = r.name || normalizePath('', r.path)
      if (k === key) return r.meta?.order
      if (r.children) {
        const val = find(r.children)
        if (val !== undefined) return val
      }
    }
    return undefined
  }
  return find(rs) ?? 9999
}

// 生成用于 useRoutes 的 RouteObject[]（与 React Router v6 兼容）
export function toReactRoutes(rs: AppRouteObject[]): RouteObject[] {
  const walk = (list: AppRouteObject[]): RouteObject[] =>
    list.map(r => {
      const wrappedElement = r.meta?.auth
        ? (
          <RequireAuth roles={r.meta?.roles} permissions={r.meta?.permissions}>
            {r.element}
          </RequireAuth>
        )
        : r.element

      return {
        path: r.path,
        element: wrappedElement,
        index: r.index,
        loader: r.loader,
        action: r.action,
        errorElement: r.errorElement,
        children: r.children ? walk(r.children) : undefined,
      }
    })
  return walk(rs)
}
