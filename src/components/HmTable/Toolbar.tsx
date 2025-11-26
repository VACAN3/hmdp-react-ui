import React, { useMemo, useState } from 'react'
import { Button, Dropdown, MenuProps, Space, Switch } from 'antd'
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

type ColumnState = { key: string; visible: boolean }

type Props = {
  persistKey?: string
  allColumns: { key: string; title: React.ReactNode }[]
  onRefresh: () => void
  onColumnsChange: (visibleKeys: string[]) => void
  sizeOptions?: Array<'large' | 'middle' | 'small'>
  size: 'large' | 'middle' | 'small'
  onSizeChange: (s: 'large' | 'middle' | 'small') => void
}

export default function Toolbar(props: Props) {
  const { persistKey, allColumns, onRefresh, onColumnsChange, sizeOptions = ['middle', 'small'], size, onSizeChange } = props
  const { t } = useTranslation('common')

  const initial = useMemo(() => {
    if (!persistKey) return allColumns.map(c => ({ key: c.key, visible: true }))
    try {
      const raw = localStorage.getItem(`hm.columns.${persistKey}`)
      if (raw) {
        const parsed: ColumnState[] = JSON.parse(raw)
        const merged = allColumns.map(c => {
          const hit = parsed.find(p => p.key === c.key)
          return { key: c.key, visible: hit ? hit.visible : true }
        })
        return merged
      }
    } catch (e) {
      console.error(e)
    }
    return allColumns.map(c => ({ key: c.key, visible: true }))
  }, [persistKey, allColumns])

  const [columns, setColumns] = useState<ColumnState[]>(initial)

  function persist(next: ColumnState[]) {
    setColumns(next)
    if (persistKey) localStorage.setItem(`hm.columns.${persistKey}`, JSON.stringify(next))
    onColumnsChange(next.filter(c => c.visible).map(c => c.key))
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'columns',
      label: (
        <div style={{ padding: 8, maxHeight: 240, overflow: 'auto' }}>
          {columns.map(c => (
            <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{marginRight: 6}}>{allColumns.find(a => a.key === c.key)?.title}</span>
              <Switch size="small" checked={c.visible} onChange={(v) => persist(columns.map(x => x.key === c.key ? { ...x, visible: v } : x))} />
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'size',
      label: (
        <Space>
          {sizeOptions.map(s => (
            <Button key={s} type={s === size ? 'primary' : 'default'} size="small" onClick={() => onSizeChange(s)}>{t(`sizeSelect.${s}`)}</Button>
          ))}
        </Space>
      ),
    },
  ]

  return (
    <Space style={{ float: 'right' }}>
      <Button icon={<ReloadOutlined />} onClick={onRefresh}>{t('refresh')}</Button>
      <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
        <Button icon={<SettingOutlined />}>{t('columnsAndDensity')}</Button>
      </Dropdown>
    </Space>
  )
}
