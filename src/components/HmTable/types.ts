import type { ColumnsType, ColumnType } from 'antd/es/table'
import type { ReactNode } from 'react'

export type RequestParams = {
  pageNum: number
  pageSize: number
  sortField?: string
  sortOrder?: 'ascend' | 'descend'
  [key: string]: any
}

export type RequestResult<T> = Promise<{ rows: T[]; total: number }>

export type Option = { label: string; value: any; disabled?: boolean }

export type FilterComponent = 'input' | 'select' | 'multiSelect' | 'dateRange' | 'number' | 'custom'

export type FilterItem = {
  name: string
  labelKey?: string
  label?: string
  component: FilterComponent
  props?: Record<string, any>
  normalize?: (val: any) => any
}

export type ActionCtx<T> = {
  selectedRowKeys: React.Key[]
  selectedRows: T[]
  refresh: () => void
}

export type ActionItem<T> = {
  key: string
  textKey: string
  icon?: ReactNode
  onClick: (ctx: ActionCtx<T>) => void | Promise<void>
  disabled?: (ctx: ActionCtx<T>) => boolean
  confirmKey?: string
  permission?: string
}

export type HmColumn<T> = ColumnType<T> & {
  titleKey?: string
}

export type HmTableProps<T extends Record<string, any>> = {
  title?: ReactNode
  rowKey: keyof T | ((row: T) => React.Key)
  columns: HmColumn<T>[]
  filters?: FilterItem[]
  request: (params: RequestParams) => RequestResult<T>
  toolbarActions?: ActionItem<T>[]
  batchActions?: ActionItem<T>[]
  persistKey?: string
  i18nNs?: string
  hasPermission?: (perm: string) => boolean
  sizeOptions?: Array<'large' | 'middle' | 'small'>
  tableProps?: Record<string, any>
}

