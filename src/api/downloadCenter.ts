import { get } from '@/utils/request'

export type ExportItem = {
  asyncExportId: number
  fileName: string
  countNow: number
  countData: number
  fileSize: string
  downNum: number
  userName: string
  createTime: string
  complateTime?: string
  status: number // 0:排队 1:处理中 2:完成 3:失败 -1:异常
}

// 查询列表（与 hmdp-ui 保持一致的接口配置）
export function getExportList(params: any): Promise<{ rows: ExportItem[]; total: number }> {
  return get<{ rows: ExportItem[]; total: number }>('/product/asyncExport/list', { params })
}

// 批量/单个下载：返回 URL 列表
export function download(params: any): Promise<{ data: string[] }> {
  return get<{ data: string[] }>('/product/asyncExport/down', { params })
}

// 重试任务
export function retry(params: any): Promise<{ data: boolean }> {
  return get<{ data: boolean }>('/product/asyncExport/retry', { params })
}

// 取消任务
export function cancel(params: any): Promise<{ data: boolean }> {
  return get<{ data: boolean }>('/product/asyncExport/cancel', { params })
}

// 状态字典（从后端字典获取并适配为 {value,label,listClass}）
export type StatusOption = { value: number; label: string; listClass: string }
export async function getStatusDict(): Promise<StatusOption[]> {
  const list = await get<any[]>('/system/dict/data/type/sys_down_status').catch(() => [])
  return (list || []).map((d: any) => ({
    value: Number(d?.dictValue ?? d?.value ?? d?.id ?? 0),
    label: String(d?.dictLabel ?? d?.label ?? ''),
    listClass: String(d?.listClass ?? d?.cssClass ?? 'info'),
  }))
}
