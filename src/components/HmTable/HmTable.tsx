import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Form, Modal, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import FilterBar from './FilterBar'
import Toolbar from './Toolbar'
import type { ActionCtx, ActionItem, HmTableProps, RequestParams } from './types'

export default function HmTable<T extends Record<string, any>>(props: HmTableProps<T>) {
  const { title, rowKey, columns, filters = [], request, toolbarActions = [], batchActions = [], persistKey, i18nNs, hasPermission, sizeOptions = ['middle', 'small'], tableProps } = props
  const { t } = useTranslation(i18nNs)
  const { t: tc } = useTranslation('common')

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | undefined>(undefined)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const [size, setSize] = useState<'large' | 'middle' | 'small'>('middle')
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(columns.map(c => (c.key as string) || (c.dataIndex as string)))

  const antdColumns: ColumnsType<T> = useMemo(() => {
    return columns
      .filter(c => visibleColumnKeys.includes(((c.key as string) || (c.dataIndex as string))))
      .map(c => ({ ...c, title: c.titleKey ? t(c.titleKey) : c.title }))
  }, [columns, visibleColumnKeys, t])

  function transformFilters(values: Record<string, any>) {
    const out: Record<string, any> = {}
    filters.forEach(f => {
      let v = values[f.name]
      if (f.normalize) v = f.normalize(v)
      else if (f.component === 'dateRange' && Array.isArray(v)) {
        out.startTime = v?.[0] ? `${v[0].format('YYYY-MM-DD')} 00:00:00` : ''
        out.endTime = v?.[1] ? `${v[1].format('YYYY-MM-DD')} 23:59:59` : ''
        return
      }
      out[f.name] = v
    })
    return out
  }

  async function run() {
    const values = form.getFieldsValue()
    const params: RequestParams = {
      pageNum,
      pageSize,
      sortField,
      sortOrder,
      ...transformFilters(values),
    }
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    try {
      const { rows, total } = await request(params)
      setData(rows)
      setTotal(total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { run() }, [])
  useEffect(() => { run() }, [pageNum, pageSize, sortField, sortOrder])

  function refresh() {
    setPageNum(1)
    run()
  }

  function handleBatch(action: ActionItem<T>) {
    const ctx: ActionCtx<T> = {
      selectedRowKeys,
      selectedRows: data.filter(d => selectedRowKeys.includes(resolveRowKey(rowKey, d))),
      refresh,
    }
    if (action.permission && hasPermission && !hasPermission(action.permission)) return
    const disabled = action.disabled?.(ctx)
    if (disabled) return
    if (action.confirmKey) {
      Modal.confirm({ title: t(action.confirmKey), onOk: () => Promise.resolve(action.onClick(ctx)) })
    } else {
      Promise.resolve(action.onClick(ctx))
    }
  }

  function resolveRowKey(key: keyof T | ((row: T) => React.Key), row: T): React.Key {
    if (typeof key === 'function') return key(row)
    return row[key] as unknown as React.Key
  }

  return (
    <Card
      bordered={false}
      title={(
        <Space>
          {title}
          {(toolbarActions || [])
            .filter(a => !a.permission || !hasPermission || hasPermission(a.permission))
            .map(a => (
              <Button
                key={a.key}
                onClick={() => handleBatch(a)}
                disabled={a.disabled?.({ selectedRowKeys, selectedRows: data.filter(d => selectedRowKeys.includes(resolveRowKey(rowKey, d))), refresh })}
                icon={a.icon}
              >
                {t(a.textKey)}
              </Button>
            ))}
        </Space>
      )}
    >
      <Form form={form} layout="horizontal" onFinish={run}>
        <FilterBar
          filters={filters}
          i18nNs={i18nNs}
          actions={(
            <Space>
              <Button type="primary" htmlType="submit">{tc('search')}</Button>
              <Button onClick={() => { form.resetFields(); setPageNum(1); run() }}>{tc('reset')}</Button>
            </Space>
          )}
        />
        <Space style={{ marginBottom: 16 }}>
          {(batchActions || []).filter(a => !a.permission || !hasPermission || hasPermission(a.permission)).map(a => (
            <Button key={a.key} onClick={() => handleBatch(a)} disabled={a.disabled?.({ selectedRowKeys, selectedRows: data.filter(d => selectedRowKeys.includes(resolveRowKey(rowKey, d))), refresh })} icon={a.icon}>{t(a.textKey)}</Button>
          ))}
        </Space>
        <Toolbar
          persistKey={persistKey}
          allColumns={columns.map(c => ({ key: ((c.key as string) || (c.dataIndex as string)), title: c.titleKey ? t(c.titleKey) : (c.title as any) }))}
          onRefresh={refresh}
          onColumnsChange={setVisibleColumnKeys}
          sizeOptions={sizeOptions}
          size={size}
          onSizeChange={setSize}
        />
      </Form>

      <Table
        rowKey={rowKey as any}
        loading={loading}
        columns={antdColumns}
        dataSource={data}
        size={size}
        pagination={{ current: pageNum, pageSize, total, showSizeChanger: true, onChange: (p, ps) => { setPageNum(p); setPageSize(ps || 10) } }}
        onChange={(pagination, filters, sorter: any) => {
          setSortField(sorter?.field)
          setSortOrder(sorter?.order)
        }}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        {...(tableProps || {})}
      />
    </Card>
  )
}
