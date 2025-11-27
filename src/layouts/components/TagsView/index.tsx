import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Dropdown, MenuProps } from 'antd'
import { CloseOutlined, ReloadOutlined, ArrowLeftOutlined, ArrowRightOutlined, ClearOutlined, DashOutlined } from '@ant-design/icons'
import { useLayout } from '../../LayoutContext'
import { routes, AppRouteObject, RouteMeta } from '@/router/routes'
import './style.css'

type VisitedView = {
  path: string
  fullPath: string
  name?: string
  title?: string
  meta?: RouteMeta
}

function normalizePath(parent: string | undefined, child: string | undefined): string {
  const p = (parent || '').replace(/\/$/, '')
  const c = (child || '').replace(/^\//, '')
  if (!c) return p || '/'
  return `${p}/${c}`.replace(/\/+/, '/')
}

function filterAffixTags(list: AppRouteObject[], basePath = ''): VisitedView[] {
  let tags: VisitedView[] = []
  list.forEach(r => {
    const path = normalizePath(basePath, r.path)
    if (r.meta?.affix) {
      tags.push({ fullPath: path, path, name: r.name, title: r.meta?.title, meta: r.meta })
    }
    if (r.children) {
      const children = filterAffixTags(r.children, path)
      if (children.length) tags = [...tags, ...children]
    }
  })
  return tags
}

function findRouteByPath(list: AppRouteObject[], path: string, basePath = ''): AppRouteObject | undefined {
  for (const r of list) {
    const p = normalizePath(basePath, r.path)
    if (p === path) return r
    if (r.children) {
      const found = findRouteByPath(r.children, path, p)
      if (found) return found
    }
  }
  return undefined
}

function getStorage(): VisitedView[] {
  try {
    const raw = localStorage.getItem('visitedViews')
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) return arr
    return []
  } catch {
    return []
  }
}

function setStorage(list: VisitedView[]) {
  try {
    localStorage.setItem('visitedViews', JSON.stringify(list))
  } catch {}
}

export default function TagsView() {
  const { settings } = useLayout()
  const location = useLocation()
  const navigate = useNavigate()
  const [visited, setVisited] = useState<VisitedView[]>(() => {
    const fromLocal = getStorage()
    const affix = filterAffixTags(routes)
    // 去重合并（以 path 唯一）
    const merged = [...affix]
    for (const v of fromLocal) {
      if (!merged.some(i => i.path === v.path)) merged.push(v)
    }
    return merged
  })
  const [selected, setSelected] = useState<VisitedView | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 同步到本地存储
  useEffect(() => {
    setStorage(visited)
  }, [visited])

  // 路由变更时添加标签
  useEffect(() => {
    const path = location.pathname
    const fullPath = location.pathname + location.search + location.hash
    const route = findRouteByPath(routes, path)
    const title = route?.meta?.title || route?.name || path
    const v: VisitedView = { path, fullPath, name: route?.name, title, meta: route?.meta }
    setVisited(prev => {
      if (prev.some(i => i.path === path)) {
        return prev.map(i => i.path === path ? { ...i, fullPath, title, meta: v.meta } : i)
      }
      return [...prev, v]
    })
    setSelected(v)
    // 将当前标签滚动可见
    setTimeout(() => {
      const el = containerRef.current?.querySelector(`[data-path="${CSS.escape(path)}"]`)
      el?.scrollIntoView({ inline: 'nearest', behavior: 'smooth' })
    }, 0)
  }, [location])

  const isAffix = (v: VisitedView) => !!v.meta?.affix
  const isActive = (v: VisitedView) => v.path === location.pathname

  const activeStyle = useMemo(() => ({
    backgroundColor: settings.theme,
    borderColor: settings.theme,
    color: '#fff',
  }), [settings.theme])

  const toLastView = (list: VisitedView[], current?: VisitedView) => {
    const latest = list.slice(-1)[0]
    if (latest) {
      navigate(latest.fullPath)
    } else {
      if (current?.name === 'Home') {
        navigate(`/redirect${current.fullPath}`)
      } else {
        navigate('/')
      }
    }
  }

  const refresh = () => {
    // 简版刷新：重载当前页面
    window.location.reload()
  }

  const close = (v: VisitedView) => {
    setVisited(prev => {
      const next = prev.filter(i => i.path !== v.path)
      if (isActive(v)) toLastView(next, v)
      return next
    })
  }

  const closeOthers = (v: VisitedView) => {
    setVisited(prev => prev.filter(i => i.path === v.path || i.meta?.affix))
    // 保持在当前
    navigate(v.fullPath)
  }

  const closeRight = (v: VisitedView) => {
    setVisited(prev => {
      const idx = prev.findIndex(i => i.path === v.path)
      if (idx === -1) return prev
      const next = prev.filter((item, i) => i <= idx || item.meta?.affix)
      if (!next.find(i => i.fullPath === location.pathname + location.search + location.hash)) {
        toLastView(next)
      }
      return next
    })
  }

  const closeLeft = (v: VisitedView) => {
    setVisited(prev => {
      const idx = prev.findIndex(i => i.path === v.path)
      if (idx === -1) return prev
      const next = prev.filter((item, i) => i >= idx || item.meta?.affix)
      if (!next.find(i => i.fullPath === location.pathname + location.search + location.hash)) {
        toLastView(next)
      }
      return next
    })
  }

  const closeAll = () => {
    setVisited(prev => {
      const affix = prev.filter(i => i.meta?.affix)
      toLastView(affix)
      return affix
    })
  }

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    const v = selected
    if (!v) return
    switch (key) {
      case 'refresh':
        refresh(); break
      case 'close':
        close(v); break
      case 'closeLeft':
        closeLeft(v); break
      case 'closeRight':
        closeRight(v); break
      case 'closeOthers':
        closeOthers(v); break
      case 'closeAll':
        closeAll(); break
    }
  }

  const menuItems: MenuProps['items'] = [
    { key: 'refresh', label: '刷新', icon: <ReloadOutlined /> },
    { type: 'divider' },
    { key: 'close', label: '关闭当前', icon: <CloseOutlined /> },
    { key: 'closeLeft', label: '关闭左侧', icon: <ArrowLeftOutlined /> },
    { key: 'closeRight', label: '关闭右侧', icon: <ArrowRightOutlined /> },
    { key: 'closeOthers', label: '关闭其他', icon: <DashOutlined /> },
    { key: 'closeAll', label: '关闭全部', icon: <ClearOutlined /> },
  ]

  const onContextMenu = (v: VisitedView) => (e: React.MouseEvent) => {
    e.preventDefault()
    setSelected(v)
  }

  return (
    <div className="tags-view">
      <Dropdown menu={{ items: menuItems, onClick: onMenuClick }} trigger={["contextMenu"]}>
        <div className="tags-view-scroll" ref={containerRef}>
          {visited.map(v => (
            <span
              key={v.path}
              className={`tag-item ${isActive(v) ? 'active' : ''} ${isAffix(v) ? 'affix' : ''}`}
              style={isActive(v) ? activeStyle : undefined}
              data-path={v.path}
              onClick={() => navigate(v.fullPath)}
              onContextMenu={onContextMenu(v)}
            >
              <span className="tag-title">{v.title || v.name || v.path}</span>
              {!isAffix(v) && (
                <CloseOutlined className="tag-close" onClick={(e) => { e.stopPropagation(); close(v) }} />
              )}
            </span>
          ))}
        </div>
      </Dropdown>
    </div>
  )
}

