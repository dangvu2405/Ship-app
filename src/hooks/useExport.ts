import { useCallback, useState } from 'react'
import api from '@/services/api'

type UseExportParams = {
  url: string
  params?: Record<string, unknown>
  filename?: string
  method?: 'GET'
  useApiRoot?: boolean
  autoDownload?: boolean
}

const filenameFromContentDisposition = (contentDisposition?: string) => {
  if (!contentDisposition) return null

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const asciiMatch = contentDisposition.match(/filename=([^;]+)/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1].replace(/["']/g, '').trim()
  }

  return null
}

const triggerDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export function useExport({
  url,
  params,
  filename,
  method = 'GET',
  useApiRoot,
  autoDownload = true,
}: UseExportParams) {
  const [isExporting, setIsExporting] = useState(false)

  const exportFile = useCallback(async () => {
    setIsExporting(true)
    try {
      const response = await api.request<Blob>({
        url,
        method,
        params,
        responseType: 'blob',
        useApiRoot,
      })

      const blob = response.data
      const nextFilename =
        filename ??
        filenameFromContentDisposition(response.headers?.['content-disposition']) ??
        'export.bin'

      if (autoDownload) {
        triggerDownload(blob, nextFilename)
      }

      return { blob, filename: nextFilename }
    } finally {
      setIsExporting(false)
    }
  }, [autoDownload, filename, method, params, useApiRoot, url])

  return {
    exportFile,
    isExporting,
  }
}