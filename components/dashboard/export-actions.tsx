'use client'

import { Download, FileSpreadsheet, FileText, Sheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ExportFormat } from '@/lib/export-formats'

type ExportActionsProps = {
  onExport: (format: ExportFormat) => void
  exporting: ExportFormat | null
  disabled?: boolean
  variant?: 'hero' | 'default'
  showPdf?: boolean
  showSheets?: boolean
  className?: string
}

export function ExportActions({
  onExport,
  exporting,
  disabled = false,
  variant = 'default',
  showPdf = true,
  showSheets = true,
  className,
}: ExportActionsProps) {
  const heroClass =
    'border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white'
  const defaultClass = ''

  const buttonClass = variant === 'hero' ? heroClass : defaultClass

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        className={buttonClass}
        disabled={disabled || Boolean(exporting)}
        onClick={() => onExport('csv')}
      >
        <Download className="mr-2 size-4" />
        {exporting === 'csv' ? 'Exporting…' : 'CSV'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={buttonClass}
        disabled={disabled || Boolean(exporting)}
        onClick={() => onExport('excel')}
      >
        <FileSpreadsheet className="mr-2 size-4" />
        {exporting === 'excel' ? 'Exporting…' : 'Excel'}
      </Button>
      {showSheets ? (
        <Button
          variant="outline"
          size="sm"
          className={buttonClass}
          disabled={disabled || Boolean(exporting)}
          onClick={() => onExport('sheets')}
        >
          <Sheet className="mr-2 size-4" />
          {exporting === 'sheets' ? 'Exporting…' : 'Google Sheets'}
        </Button>
      ) : null}
      {showPdf ? (
        <Button
          variant="outline"
          size="sm"
          className={buttonClass}
          disabled={disabled || Boolean(exporting)}
          onClick={() => onExport('pdf')}
        >
          <FileText className="mr-2 size-4" />
          {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
        </Button>
      ) : null}
    </div>
  )
}
