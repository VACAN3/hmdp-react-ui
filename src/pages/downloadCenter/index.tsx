import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Table, Tag, message } from 'antd'
import { DownloadOutlined, RedoOutlined, StopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getExportList, download, retry, cancel, getStatusDict, type ExportItem } from '@/api/downloadCenter'
import { useTranslation } from 'react-i18next'
import { listAdminUser } from '@/api/system/user'

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
    queryList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns: ColumnsType<ExportItem> = useMemo(() => [
    { title: t('fileName'), dataIndex: 'fileName', key: 'fileName', width: 200, ellipsis: true },
    {
      title: t('progress'),
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
    { title: t('countNow'), dataIndex: 'countNow', key: 'countNow', width: 100 },
    { title: t('countData'), dataIndex: 'countData', key: 'countData', width: 100 },
    { title: t('fileSize'), dataIndex: 'fileSize', key: 'fileSize', width: 120 },
    { title: t('downNum'), dataIndex: 'downNum', key: 'downNum', width: 110 },
    { title: t('userName'), dataIndex: 'userName', key: 'userName', width: 120 },
    { title: t('createTime'), dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: t('complateTime'), dataIndex: 'complateTime', key: 'complateTime', width: 180 },
    {
      title: t('status'),
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
      title: t('operate'),
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

  return (
    <Card title={tc('navbar.downloadCenter')} bordered={false}>
      <Form form={form} layout="vertical" onFinish={queryList} initialValues={{ complate: 0 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="fileName" label={t('fileName')}>
              <Input placeholder={tc('inputPlaceholder')} allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="statusList" label={t('status')}>
              <Select
                mode="multiple"
                allowClear
                options={statusOptions.map(o => ({ value: o.value, label: o.label }))}
                placeholder={tc('selectPlaceholder')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('timeRange')}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="complate" noStyle>
                  <Select style={{ width: 120 }} options={[{ value: 0, label: t('complateComplete') }, { value: 1, label: t('complateGenerate') }]} />
                </Form.Item>
                <Form.Item name="time" noStyle>
                  <RangePicker
                    style={{ width: '100%' }}
                    onChange={() => void 0}
                    disabledDate={d => d.isAfter(dayjs())}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="createUserIdList" label={t('createUserIdList')}>
              <Select
                mode="multiple"
                showSearch
                filterOption={false}
                onSearch={remoteUsers}
                onDropdownVisibleChange={(open) => open && remoteUsers('')}
                loading={userLoading}
                options={userOptions}
                allowClear
                placeholder={tc('selectPlaceholder')}
              />
            </Form.Item>
          </Col>
        </Row>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={queryList}>{tc('search')}</Button>
          <Button onClick={() => { form.resetFields(); refresh() }}>{tc('reset')}</Button>
          <Button plain={false as any} disabled={!selectedRowKeys.length} icon={<DownloadOutlined />} onClick={handleDownload}>{t('batchDownload')}</Button>
          <Button plain={false as any} disabled={!selectedRowKeys.length} icon={<RedoOutlined />} onClick={handleRetry}>{t('batchRetry')}</Button>
          <Button plain={false as any} disabled={!selectedRowKeys.length} danger icon={<StopOutlined />} onClick={handleCancel}>{t('batchCancel')}</Button>
        </Space>
      </Form>

      <Table
        rowKey="asyncExportId"
        bordered
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        pagination={{ current: page, pageSize, total, showSizeChanger: true, onChange: (p, ps) => { setPage(p); setPageSize(ps); queryList() } }}
        rowSelection={{ selectedRowKeys, onChange: (keys, rows) => { setSelectedRowKeys(keys); setSelectedRows(rows as ExportItem[]) } }}
      />
    </Card>
  )
}
