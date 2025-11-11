// 参考 hmdp-ui 的响应码枚举，按常见后端约定实现
// 可根据实际后端返回进一步增补或调整
export enum HttpStatus {
  SUCCESS = 200,
  SUCCESS_ALT = 0, // 部分接口以 0 代表成功
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  GATEWAY_TIMEOUT = 504,
  WARN = 601, // 业务警告（如在 hmdp-ui 中常见）
}

export function isSuccess(code?: number): boolean {
  return code === HttpStatus.SUCCESS || code === HttpStatus.SUCCESS_ALT
}

export function needRelogin(code?: number): boolean {
  return code === HttpStatus.UNAUTHORIZED
}