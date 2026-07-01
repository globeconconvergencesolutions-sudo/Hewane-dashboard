'use client'

import { useCallback, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { ExportFormat } from '@/lib/export-formats'

function extensionForFormat(format: ExportFormat) {
  switch (format) {
    case 'excel':
      return 'xlsx'
    case 'pdf':
      return 'pdf'
    case 'sheets':
      return 'csv'
    default:
      return 'csv'
  }
}

function formatLabel(format: ExportFormat) {
  switch (format) {
    case 'excel':
      return 'Excel'
    case 'pdf':
      return 'PDF'
    case 'sheets':
      return 'Google Sheets'
    default:
      return 'CSV'
  }
}

type ExportRequest =
  | {
      url: string
      method?: 'GET'
      body?: never
      filenameBase: string
    }
  | {
      url: string
      method: 'POST'
      body: unknown
      filenameBase: string
    }

export function useExportDownload() {
  const { toast } = useToast()
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const downloadExport = useCallback(
    async (format: ExportFormat, request: ExportRequest) => {
      setExporting(format)
      try {
        const res = await fetch(request.url, {
          method: request.method ?? 'GET',
          headers: request.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
          body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
        })

        if (!res.ok) {
          let message = 'Export failed'
          try {
            const payload = (await res.json()) as { error?: string; details?: string }
            if (payload.details) message = payload.details
            else if (payload.error) message = payload.error
          } catch {
            // ignore
          }
          throw new Error(message)
        }

        const blob = await res.blob()
        const disposition = res.headers.get('Content-Disposition') || ''
        const match = disposition.match(/filename="([^"]+)"/)
        const filename =
          match?.[1] ||
          `${request.filenameBase}-${Date.now()}.${extensionForFormat(format)}`

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Export ready',
          description:
            format === 'sheets'
              ? 'Downloaded Google Sheets–compatible CSV. Import via File → Import in Google Sheets.'
              : `Downloaded ${formatLabel(format)} file.`,
        })
      } catch (error) {
        toast({
          title: 'Export failed',
          description: error instanceof Error ? error.message : 'Could not generate export.',
          variant: 'destructive',
        })
      } finally {
        setExporting(null)
      }
    },
    [toast]
  )

  return { downloadExport, exporting }
}
