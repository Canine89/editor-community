'use client'

import QRCode from 'qrcode'

export interface QRCodeOptions {
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  type: 'png' | 'svg'
  quality: number
  margin: number
  color: {
    dark: string
    light: string
  }
  width: number
}

export interface QRCodeData {
  type: 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard'
  value: string
  
  // vCard 전용 필드
  name?: string
  organization?: string
  phone?: string
  email?: string
  
  // Wi-Fi 전용 필드
  ssid?: string
  password?: string
  security?: 'WPA' | 'WEP' | 'nopass'
  hidden?: boolean
}

export const defaultQROptions: QRCodeOptions = {
  errorCorrectionLevel: 'M',
  type: 'png',
  quality: 0.92,
  margin: 1,
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  width: 256
}

export function formatQRData(data: QRCodeData): string {
  switch (data.type) {
    case 'url':
      return data.value.startsWith('http') ? data.value : `https://${data.value}`
    
    case 'text':
      return data.value
    
    case 'email':
      return `mailto:${data.value}`
    
    case 'phone':
      return `tel:${data.value}`
    
    case 'sms':
      return `sms:${data.value}`
    
    case 'wifi':
      const { ssid = '', password = '', security = 'WPA', hidden = false } = data
      return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`
    
    case 'vcard':
      const { name = '', organization = '', phone = '', email = '' } = data
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        name && `FN:${name}`,
        organization && `ORG:${organization}`,
        phone && `TEL:${phone}`,
        email && `EMAIL:${email}`,
        'END:VCARD'
      ].filter(Boolean).join('\\n')
    
    default:
      return data.value
  }
}

export async function generateQRCode(
  data: QRCodeData,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  const opts = { ...defaultQROptions, ...options }
  const qrData = formatQRData(data)
  
  const qrOptions = {
    errorCorrectionLevel: opts.errorCorrectionLevel,
    quality: opts.quality,
    margin: opts.margin,
    color: opts.color,
    width: opts.width
  }
  
  if (opts.type === 'svg') {
    return await QRCode.toString(qrData, {
      ...qrOptions,
      type: 'svg'
    })
  } else {
    return await QRCode.toDataURL(qrData, {
      ...qrOptions,
      type: 'image/png'
    })
  }
}

export function downloadQRCode(dataUrl: string, filename: string = 'qrcode'): void {
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadSVGQRCode(svgString: string, filename: string = 'qrcode'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.download = `${filename}.svg`
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// QR 코드 데이터 검증
export function validateQRData(data: QRCodeData): { valid: boolean; error?: string } {
  if (!data.value.trim()) {
    return { valid: false, error: '내용을 입력해주세요.' }
  }
  
  switch (data.type) {
    case 'url':
      try {
        new URL(data.value.startsWith('http') ? data.value : `https://${data.value}`)
        return { valid: true }
      } catch {
        return { valid: false, error: '올바른 URL 형식이 아닙니다.' }
      }
    
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.value)) {
        return { valid: false, error: '올바른 이메일 형식이 아닙니다.' }
      }
      return { valid: true }
    
    case 'phone':
      const phoneRegex = /^[\d\-\+\(\)\s]+$/
      if (!phoneRegex.test(data.value)) {
        return { valid: false, error: '올바른 전화번호 형식이 아닙니다.' }
      }
      return { valid: true }
    
    case 'wifi':
      if (!data.ssid) {
        return { valid: false, error: 'Wi-Fi 이름(SSID)를 입력해주세요.' }
      }
      return { valid: true }
    
    case 'vcard':
      if (!data.name) {
        return { valid: false, error: '이름을 입력해주세요.' }
      }
      return { valid: true }
    
    default:
      return { valid: true }
  }
}