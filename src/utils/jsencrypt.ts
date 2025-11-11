import JSEncrypt from 'jsencrypt'

const publicKey = import.meta.env.VITE_APP_RSA_PUBLIC_KEY || ''
const privateKey = import.meta.env.VITE_APP_RSA_PRIVATE_KEY || ''

export function encrypt(text: string): string {
  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(publicKey)
  const result = jsEncrypt.encrypt(text)
  if (!result) throw new Error('RSA 公钥加密失败：请检查 VITE_APP_RSA_PUBLIC_KEY')
  return result
}

export function decrypt(text: string): string {
  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPrivateKey(privateKey)
  const result = jsEncrypt.decrypt(text)
  if (!result) throw new Error('RSA 私钥解密失败：请检查 VITE_APP_RSA_PRIVATE_KEY')
  return result
}