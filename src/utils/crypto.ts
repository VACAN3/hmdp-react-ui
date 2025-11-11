import CryptoJS from 'crypto-js'

// 生成指定长度的随机字符串
export function randomString(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成 AES 密钥（WordArray）
export function generateAesKey(): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Utf8.parse(randomString(16))
}

// 将 WordArray 转为 Base64 字符串
export function encryptBase64(wordArray: CryptoJS.lib.WordArray): string {
  return CryptoJS.enc.Base64.stringify(wordArray)
}

// 从 Base64 字符串解析为 WordArray
export function decryptBase64(base64Str: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Base64.parse(base64Str)
}

// 使用 AES(ECB/Pkcs7) 加密字符串
export function encryptWithAes(plainText: string, key: CryptoJS.lib.WordArray): string {
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

// 使用 AES(ECB/Pkcs7) 解密字符串
export function decryptWithAes(cipherText: string, key: CryptoJS.lib.WordArray): string {
  const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return CryptoJS.enc.Utf8.stringify(decrypted)
}