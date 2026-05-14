'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, QrCode } from 'lucide-react'

interface QRCodeDisplayProps {
  data: string
  title?: string
  size?: number
}

export function QRCodeDisplay({ data, title = 'QR Code', size = 150 }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(data, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
        setQrDataUrl(url)
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err)
      }
    }
    
    if (data) {
      generateQR()
    }
  }, [data, size])

  const handleDownload = () => {
    if (!qrDataUrl) return
    
    const link = document.createElement('a')
    link.download = `qrcode-${data.slice(0, 20)}.png`
    link.href = qrDataUrl
    link.click()
  }

  if (!qrDataUrl) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-muted animate-pulse rounded" 
            style={{ width: size, height: size }} 
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-center">
          <img 
            src={qrDataUrl} 
            alt={`QR Code: ${data}`}
            className="rounded border"
            width={size}
            height={size}
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar QR Code
        </Button>
      </CardContent>
    </Card>
  )
}
