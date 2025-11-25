import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Device = 'desktop' | 'mobile'

type SidebarState = {
  opened: boolean
  withoutAnimation: boolean
  hide: boolean
}

type SettingsState = {
  tagsView: boolean
  fixedHeader: boolean
  theme: string
}

type LayoutContextValue = {
  device: Device
  sidebar: SidebarState
  settings: SettingsState
  toggleDevice: (d: Device) => void
  openSideBar: (opt?: { withoutAnimation?: boolean }) => void
  closeSideBar: (opt?: { withoutAnimation?: boolean }) => void
  toggleSideBarHide: (hide?: boolean) => void
  setFixedHeader: (fixed: boolean) => void
  setTagsView: (show: boolean) => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider')
  return ctx
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<Device>('desktop')
  const [sidebar, setSidebar] = useState<SidebarState>({ opened: true, withoutAnimation: false, hide: false })
  const [settings, setSettings] = useState<SettingsState>({ tagsView: true, fixedHeader: true, theme: '#409EFF' })

  useEffect(() => {
    const WIDTH = 992
    const onResize = () => {
      const isMobile = window.innerWidth - 1 < WIDTH
      setDevice(isMobile ? 'mobile' : 'desktop')
      if (isMobile) {
        setSidebar(s => ({ ...s, opened: false, withoutAnimation: true }))
      }
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const value = useMemo<LayoutContextValue>(() => ({
    device,
    sidebar,
    settings,
    toggleDevice: (d) => setDevice(d),
    openSideBar: (opt) => setSidebar(s => ({ ...s, opened: true, withoutAnimation: !!opt?.withoutAnimation })),
    closeSideBar: (opt) => setSidebar(s => ({ ...s, opened: false, withoutAnimation: !!opt?.withoutAnimation })),
    toggleSideBarHide: (hide) => setSidebar(s => ({ ...s, hide: hide ?? !s.hide })),
    setFixedHeader: (fixed) => setSettings(s => ({ ...s, fixedHeader: fixed })),
    setTagsView: (show) => setSettings(s => ({ ...s, tagsView: show })),
  }), [device, sidebar, settings])

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

