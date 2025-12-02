import React, { useCallback, useMemo } from 'react'
import { Button, Modal, Space, Tag, message } from 'antd'
import { DownloadOutlined, RedoOutlined, StopOutlined } from '@ant-design/icons'
import { getExportList, download, retry, cancel, getStatusDict, type ExportItem } from '@/api/downloadCenter'
import { useTranslation } from 'react-i18next'
import { listAdminUser } from '@/api/system/user'
import HmTable from '@/components/HmTable/HmTable'
import type { HmColumn, FilterItem, RequestParams, ActionItem } from '@/components/HmTable/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type QueryForm = {
  fileName?: string
  complate?: number // 0: 完成时间, 1: 生成时间（与 hmdp-ui 对齐，服务端取布尔）
  time?: any
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
  const queryClient = useQueryClient()
  
  // 状态字典查询
  const { data: statusOptions = [] } = useQuery({
    queryKey: ['downloadCenter', 'statusDict'],
    queryFn: getStatusDict,
    staleTime: Infinity, // 字典数据永久缓存
  })

  // 用户列表查询（用于筛选生成人）
  const { data: userOptions = [] } = useQuery({
    queryKey: ['system', 'adminUsers'],
    queryFn: async () => {
      const res = await listAdminUser({ pageNum: 1, pageSize: 9999 })
      return (res.rows || []).map(u => ({ label: u.nickName || u.userName, value: u.userId }))
    },
    staleTime: 1000 * 60 * 10, // 10分钟缓存
  })

  // 取消任务 Mutation
  const cancelMutation = useMutation({
    mutationFn: cancel,
    onSuccess: (res) => {
      if (res.data) {
        message.success(tc('success'))
        // 刷新列表
        queryClient.invalidateQueries({ queryKey: ['downloadCenter', 'list'] })
      }
    }
  })

  // 重试任务 Mutation
  const retryMutation = useMutation({
    mutationFn: retry,
    onSuccess: (res) => {
      if (res.data) {
        message.success(tc('success'))
        queryClient.invalidateQueries({ queryKey: ['downloadCenter', 'list'] })
      }
    }
  })

  // 下载任务 Mutation
  const downloadMutation = useMutation({
    mutationFn: download,
    onSuccess: (data) => {
      const urls = data?.data || []
      if (urls.length) loopDownload(urls[0])
      queryClient.invalidateQueries({ queryKey: ['downloadCenter', 'list'] })
    }
  })

  const handleCancelRow = useCallback((row: ExportItem) => {
    Modal.confirm({
      title: t('cancelTitle'),
      onOk: () => cancelMutation.mutateAsync({ ids: row.asyncExportId })
    })
  }, [t, cancelMutation])

  const handleRetryRow = useCallback((row: ExportItem) => {
    Modal.confirm({
      title: t('retryTitle'),
      onOk: () => retryMutation.mutateAsync({ ids: row.asyncExportId })
    })
  }, [t, retryMutation])

  const handleDownloadRow = useCallback((row: ExportItem) => {
    Modal.confirm({
      title: t('downloadTitle'),
      onOk: () => downloadMutation.mutateAsync({ ids: row.asyncExportId })
    })
  }, [t, downloadMutation])

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
  ], [statusOptions, t, handleCancelRow, handleRetryRow, handleDownloadRow])

  const filterItems: FilterItem[] = useMemo(() => [
    { name: 'fileName', label: t('fileName'), component: 'input' },
    {
      name: 'statusList',
      label: t('status'),
      component: 'multiSelect',
      props: { options: statusOptions }
    },
    {
      name: 'time',
      label: t('timeRange'),
      component: 'dateRange'
    },
    {
      name: 'createUserIdList',
      label: t('createUserIdList'),
      component: 'multiSelect',
      props: { options: userOptions }
    }
  ], [statusOptions, userOptions, t])

  // HmTable 请求函数模块化
  const requestExportList = async (params: RequestParams) => {
    const req = {
      ...params,
      createUserIdList: Array.isArray(params.createUserIdList) && params.createUserIdList.length ? params.createUserIdList : '',
    }
    
    /**
     *
     使用 queryClient.fetchQuery 来发起请求，这样也能利用到缓存机制 
     这是一个桥接模式 ：
       1. HmTable 组件是一个传统的组件，它通过调用 request 函数来拿数据（命令式）。
       2. 如果我们直接返回 axios.get(...) ，那么数据就没进 React Query 的缓存系统。
       3. 使用 queryClient.fetchQuery ，我们手动触发了一次 React Query 的请求流程。
          - 好处 1 ：数据被存进了缓存。
          - 好处 2 ：当我们 invalidateQueries 时，这个缓存被标记为脏。下次 HmTable 再调用这个函数时，fetchQuery 会 发现缓存脏 了，强制去后端拉新的；如果缓存没脏且在有效期内，fetchQuery 会直接返回内存数据，省去一次网络请求 。
     总结 ：这段代码把一个普通的表格请求函数，“升级”成了具有缓存管理能力的请求函数。
    */
    const res = await queryClient.fetchQuery({
      queryKey: ['downloadCenter', 'list', req],
      queryFn: () => getExportList(req),
      staleTime: 1000 * 60, // 1分钟缓存
    })
    return { rows: res.rows, total: res.total }
  }

  const batchActions: ActionItem<ExportItem>[] = [
    {
      key: 'batchDownload',
      textKey: 'batchDownload',
      icon: <DownloadOutlined />,
      onClick: async ({ selectedRows }) => {
        if (!selectedRows.length) return message.warning(t('selectTip'))
        const target = selectedRows.filter(r => r.status === 2).map(r => r.asyncExportId).join(',')
        if (!target) return message.warning(t('noFile'))
        Modal.confirm({ title: t('batchDownloadTitle'), onOk: () => downloadMutation.mutateAsync({ ids: target }) })
      },
    },
    {
      key: 'batchRetry',
      textKey: 'batchRetry',
      icon: <RedoOutlined />,
      onClick: async ({ selectedRows }) => {
        if (!selectedRows.length) return message.warning(t('selectTip'))
        const target = selectedRows.filter(r => r.status === 3 || r.status === -1 || r.status === 1).map(r => r.asyncExportId).join(',')
        if (!target) return
        Modal.confirm({ title: t('batchRetryTitle'), onOk: () => retryMutation.mutateAsync({ ids: target }) })
      },
    },
    {
      key: 'batchCancel',
      textKey: 'batchCancel',
      icon: <StopOutlined />,
      onClick: async ({ selectedRows }) => {
        if (!selectedRows.length) return message.warning(t('selectTip'))
        const target = selectedRows.filter(r => r.status === 0 || r.status === 1).map(r => r.asyncExportId).join(',')
        if (!target) return
        Modal.confirm({ title: t('batchCancelTitle'), onOk: () => cancelMutation.mutateAsync({ ids: target }) })
      },
    },
  ]

  

  // 批量操作由 HmTable 的 batchActions 传入，不依赖本地 selectedRows

  return (
    <div className="download-center">
      <HmTable
        title={tc('navbar.downloadCenter')}
        rowKey="asyncExportId"
        columns={columns}
        request={requestExportList}
        filters={filterItems}
        batchActions={batchActions}
        i18nNs={'downloadCenter'}
      />
    </div>
  )
}
