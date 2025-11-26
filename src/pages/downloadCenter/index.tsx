import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Table, Tag, message } from 'antd'
import { DownloadOutlined, RedoOutlined, StopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getExportList, download, retry, cancel, getStatusDict, type ExportItem } from '@/api/downloadCenter'
import { useTranslation } from 'react-i18next'
import { listAdminUser } from '@/api/system/user'
import HmTable from '@/components/HmTable/HmTable'
import type { HmColumn, FilterItem, RequestParams, ActionItem } from '@/components/HmTable/types'

const { RangePicker } = DatePicker

type QueryForm = {
  fileName?: string
  complate?: number // 0: 完成时间, 1: 生成时间（与 hmdp-ui 对齐，服务端取布尔）
  time?: [dayjs.Dayjs, dayjs.Dayjs]
  statusList?: number[]
  createUserIdList?: number[]
}

// 遍历-下载
const loopDownload = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = url.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('下载失败:', error);
  }
};

export default function DownloadCenter() {
  const { t } = useTranslation('downloadCenter')
  const { t: tc } = useTranslation('common')
  const [form] = Form.useForm<QueryForm>()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<ExportItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [statusOptions, setStatusOptions] = useState<{ value: number; label: string; listClass: string }[]>([])
  const [userOptions, setUserOptions] = useState<{ value: number; label: string }[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<ExportItem[]>([])

  useEffect(() => {
    getStatusDict().then(setStatusOptions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns: HmColumn<ExportItem>[] = useMemo(() => [
    { titleKey: 'fileName', dataIndex: 'fileName', key: 'fileName', width: 200, ellipsis: true },
    {
      titleKey: 'progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 200,
      render: (_: any, row: ExportItem) => {
        const now = row.countNow || 0
        const total = row.countData || 0
        const percent = total ? Math.round((now / total) * 100) : 0
        return (
          <div style={{ textAlign: 'left' }}>
            <div>{t('countText')}{now} / {total}</div>
            <div>{t('progressText')}{percent}%</div>
          </div>
        )
      },
    },
    { titleKey: 'countNow', dataIndex: 'countNow', key: 'countNow', width: 100 },
    { titleKey: 'countData', dataIndex: 'countData', key: 'countData', width: 100 },
    { titleKey: 'fileSize', dataIndex: 'fileSize', key: 'fileSize', width: 120 },
    { titleKey: 'downNum', dataIndex: 'downNum', key: 'downNum', width: 110 },
    { titleKey: 'userName', dataIndex: 'userName', key: 'userName', width: 120 },
    { titleKey: 'createTime', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { titleKey: 'complateTime', dataIndex: 'complateTime', key: 'complateTime', width: 180 },
    {
      titleKey: 'status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (val: number) => {
        const opt = statusOptions.find(o => o.value === val)
        const colorMap: Record<string, string> = { success: 'green', danger: 'red', warning: 'orange', info: 'blue' }
        return <Tag color={colorMap[opt?.listClass || 'info']}>{opt?.label ?? val}</Tag>
      },
    },
    {
      titleKey: 'operate',
      key: 'operate',
      width: 160,
      render: (_: any, row: ExportItem) => {
        const canCancel = row.status === 0 || row.status === 1
        const canDownload = row.status === 2
        const canRetry = row.status === 3 || row.status === -1 || row.status === 1
        return (
          <Space>
            {canCancel && <Button type="link" onClick={() => handleCancelRow(row)}>{t('cancel')}</Button>}
            {canDownload && <Button type="link" onClick={() => handleDownloadRow(row)}>{t('download')}</Button>}
            {canRetry && <Button type="link" onClick={() => handleRetryRow(row)}>{t('retry')}</Button>}
          </Space>
        )
      },
    },
  ], [statusOptions, t])

  // HmTable 请求函数模块化
  const requestExportList = async (params: RequestParams) => {
    const req = {
      ...params,
      createUserIdList: Array.isArray(params.createUserIdList) && params.createUserIdList.length ? params.createUserIdList : '',
    }
    const res = await getExportList(req)
    return { rows: res.rows, total: res.total }
  }

  // 批量操作模块化
  const batchDownloadAction: ActionItem<ExportItem> = {
    key: 'download',
    textKey: 'batchDownload',
    icon: <DownloadOutlined />,
    confirmKey: 'batchDownloadTitle',
    onClick: async ({ selectedRows, refresh }) => {
      if (!selectedRows.length) return message.warning(t('selectTip'))
      const target = selectedRows.filter(r => r.status === 2).map(r => r.asyncExportId).join(',')
      if (!target) return message.info(t('noFile'))
      const res = await download({ ids: target })
      const urls = res.data || []
      urls.forEach(url => window.open(url, '_blank'))
      refresh()
    },
    disabled: ({ selectedRowKeys }) => !selectedRowKeys.length,
  }

  const batchRetryAction: ActionItem<ExportItem> = {
    key: 'retry',
    textKey: 'batchRetry',
    icon: <RedoOutlined />,
    confirmKey: 'batchRetryTitle',
    onClick: async ({ selectedRows, refresh }) => {
      if (!selectedRows.length) return message.warning(t('selectTip'))
      const target = selectedRows.filter(r => r.status === 3 || r.status === -1 || r.status === 1).map(r => r.asyncExportId).join(',')
      if (!target) return
      const res = await retry({ ids: target })
      if (res.data) message.success(tc('success'))
      refresh()
    },
    disabled: ({ selectedRowKeys }) => !selectedRowKeys.length,
  }

  const batchCancelAction: ActionItem<ExportItem> = {
    key: 'cancel',
    textKey: 'batchCancel',
    icon: <StopOutlined />,
    confirmKey: 'batchCancelTitle',
    onClick: async ({ selectedRows, refresh }) => {
      if (!selectedRows.length) return message.warning(t('selectTip'))
      const target = selectedRows.filter(r => r.status === 0 || r.status === 1).map(r => r.asyncExportId).join(',')
      if (!target) return
      const res = await cancel({ ids: target })
      if (res.data) message.success(tc('success'))
      refresh()
    },
    disabled: ({ selectedRowKeys }) => !selectedRowKeys.length,
  }

  async function queryList() {
    const values = form.getFieldsValue()
    const time = values.time || []
    const startTime = time?.[0] ? `${dayjs(time[0]).format('YYYY-MM-DD')} 00:00:00` : ''
    const endTime = time?.[1] ? `${dayjs(time[1]).format('YYYY-MM-DD')} 23:59:59` : ''
    const params = {
      fileName: values.fileName,
      complate: !!values.complate,
      startTime,
      endTime,
      statusList: values.statusList,
      createUserIdList: values.createUserIdList?.length ? values.createUserIdList : '',
      pageNum: page,
      pageSize,
    }
    setLoading(true)
    try {
      const { rows, total } = await getExportList(params)
      setDataSource(rows)
      setTotal(total)
    } finally {
      setLoading(false)
    }
  }

  async function remoteUsers(query?: string) {
    setUserLoading(true)
    try {
      const { rows } = await listAdminUser({ pageNum: 1, pageSize: 10, deptId: 100, userNameOrNickName: query })
      const opts = (rows || []).map((u: any) => ({ value: u.userId, label: `${u.userName}[${u.nickName}]` }))
      setUserOptions(opts)
    } finally {
      setUserLoading(false)
    }
  }

  function refresh() {
    setPage(1)
    queryList()
  }

  async function handleDownload() {
    if (selectedRows.length === 0) return message.warning(t('selectTip'))
    const target = selectedRows.filter(r => r.status === 2).map(r => r.asyncExportId).join(',')
    if (!target) return message.info(t('noFile'))
    Modal.confirm({
      title: t('batchDownloadTitle'),
      onOk: async () => {
        const data = await download({ ids: target })
        const urls = data || []
        urls.forEach((url: string) => {
          loopDownload(url);
        });
        refresh()
      },
    })
  }

  async function handleRetry() {
    if (!selectedRows.length) return message.warning(t('selectTip'))
    const target = selectedRows.filter(r => r.status === 3 || r.status === -1 || r.status === 1).map(r => r.asyncExportId).join(',')
    if (!target) return
    Modal.confirm({
      title: t('batchRetryTitle'),
      onOk: async () => {
        const res = await retry({ ids: target })
        if (res.data) {
          message.success(tc('success'))
          refresh()
        }
      },
    })
  }

  async function handleCancel() {
    if (!selectedRows.length) return message.warning(t('selectTip'))
    const target = selectedRows.filter(r => r.status === 0 || r.status === 1).map(r => r.asyncExportId).join(',')
    if (!target) return
    Modal.confirm({
      title: t('batchCancelTitle'),
      onOk: async () => {
        const res = await cancel({ ids: target })
        if (res.data) {
          message.success(tc('success'))
          refresh()
        }
      },
    })
  }

  async function handleDownloadRow(row: ExportItem) {
    Modal.confirm({
      title: t('downloadTitle'),
      onOk: async () => {
        const data = await download({ ids: row.asyncExportId })
        const url = (data || [])
        if (url.length) loopDownload(url[0]);
        refresh()
      },
    })
  }

  async function handleRetryRow(row: ExportItem) {
    Modal.confirm({
      title: t('retryTitle'),
      onOk: async () => {
        const res = await retry({ ids: row.asyncExportId })
        if (res.data) message.success(tc('success'))
        refresh()
      },
    })
  }

  async function handleCancelRow(row: ExportItem) {
    Modal.confirm({
      title: t('cancelTitle'),
      onOk: async () => {
        const res = await cancel({ ids: row.asyncExportId })
        if (res.data) message.success(tc('success'))
        refresh()
      },
    })
  }

  const filters: FilterItem[] = [
    { name: 'fileName', labelKey: 'fileName', component: 'input' },
    { name: 'statusList', labelKey: 'status', component: 'multiSelect', props: { options: statusOptions.map(o => ({ value: o.value, label: o.label })) } },
    { name: 'time', labelKey: 'timeRange', component: 'dateRange' },
    { name: 'createUserIdList', labelKey: 'createUserIdList', component: 'multiSelect', props: { options: userOptions, showSearch: true, filterOption: false, onSearch: remoteUsers, onDropdownVisibleChange: (open: boolean) => open && remoteUsers(''), loading: userLoading } },
  ]

  return (
    <HmTable<ExportItem>
      title={tc('navbar.downloadCenter')}
      rowKey="asyncExportId"
      columns={columns}
      filters={filters}
      request={requestExportList}
      batchActions={[batchDownloadAction, batchRetryAction, batchCancelAction]}
      persistKey="download-center"
      i18nNs="downloadCenter"
    />
  )
}
