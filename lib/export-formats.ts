import { createRequire } from 'node:module'
import path from 'node:path'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type PDFDocumentType from 'pdfkit'

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'sheets'

export type ExportTable = {
  title: string
  sheetName?: string
  filenameBase: string
  headers: string[]
  rows: string[][]
}

const FORMAT_ALIASES: Record<string, ExportFormat> = {
  csv: 'csv',
  excel: 'excel',
  xlsx: 'excel',
  pdf: 'pdf',
  sheets: 'sheets',
  'google-sheets': 'sheets',
  googlesheets: 'sheets',
  gsheet: 'sheets',
}

const require = createRequire(import.meta.url)

let pdfDocumentPromise: Promise<typeof PDFDocumentType> | null = null

async function loadPDFDocument() {
  if (!pdfDocumentPromise) {
    const fontRoot = path.dirname(require.resolve('pdfkit/package.json'))
    process.env.PDFKIT_FONT_PATH = path.join(fontRoot, 'js', 'data')
    pdfDocumentPromise = import('pdfkit').then(
      (mod) => mod.default as typeof PDFDocumentType
    )
  }
  return pdfDocumentPromise
}

export function parseExportFormat(value: string | null | undefined): ExportFormat | null {
  if (!value) return null
  return FORMAT_ALIASES[value.trim().toLowerCase()] ?? null
}

export function exportFilename(base: string, format: ExportFormat, timestamp = Date.now()) {
  const safeBase = base.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-')
  switch (format) {
    case 'excel':
      return `${safeBase}-${timestamp}.xlsx`
    case 'pdf':
      return `${safeBase}-${timestamp}.pdf`
    case 'sheets':
      return `${safeBase}-${timestamp}-google-sheets.csv`
    default:
      return `${safeBase}-${timestamp}.csv`
  }
}

function csvFromTable(table: ExportTable, forGoogleSheets = false) {
  const csv = Papa.unparse([table.headers, ...table.rows])
  if (!forGoogleSheets) return csv
  return `\uFEFF${csv}`
}

async function pdfFromTable(table: ExportTable) {
  const PDFDocument = await loadPDFDocument()

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 48,
      size: 'A4',
      layout: table.headers.length > 6 ? 'landscape' : 'portrait',
    })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(16).fillColor('#1a1a2e').text(table.title, { align: 'left' })
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Generated ${new Date().toLocaleString()}`, { align: 'left' })
    doc.moveDown()

    if (table.headers.length === 0) {
      doc.fillColor('#000000').fontSize(11).text('No data available.')
      doc.end()
      return
    }

    const columnCount = Math.max(table.headers.length, 1)
    const rowHeight = 20
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const columnWidth = pageWidth / columnCount

    const drawRow = (cells: string[], y: number, header = false) => {
      const padded = [...cells]
      while (padded.length < columnCount) padded.push('')

      padded.forEach((value, index) => {
        const x = doc.page.margins.left + index * columnWidth
        doc
          .font(header ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(header ? 9 : 8)
          .fillColor(header ? '#1a1a2e' : '#222222')
          .text(String(value ?? '') || '—', x + 4, y + 5, {
            width: columnWidth - 8,
            height: rowHeight - 6,
            ellipsis: true,
          })
      })

      doc
        .strokeColor('#dddddd')
        .moveTo(doc.page.margins.left, y + rowHeight)
        .lineTo(doc.page.width - doc.page.margins.right, y + rowHeight)
        .stroke()
    }

    let y = doc.y + 8
    drawRow(table.headers, y, true)
    y += rowHeight

    for (const row of table.rows) {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage({
          layout: table.headers.length > 6 ? 'landscape' : 'portrait',
          size: 'A4',
          margin: 48,
        })
        y = doc.page.margins.top
        drawRow(table.headers, y, true)
        y += rowHeight
      }
      drawRow(row, y)
      y += rowHeight
    }

    doc.end()
  })
}

export async function buildExportResponse(table: ExportTable, format: ExportFormat) {
  const timestamp = Date.now()
  const filename = exportFilename(table.filenameBase, format, timestamp)

  if (format === 'csv') {
    return new Response(csvFromTable(table), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  if (format === 'sheets') {
    return new Response(csvFromTable(table, true), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Target': 'google-sheets',
      },
    })
  }

  if (format === 'excel') {
    const worksheet = XLSX.utils.aoa_to_sheet([table.headers, ...table.rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, table.sheetName || 'Export')
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const pdfBuffer = await pdfFromTable(table)
  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

export function aoaFromRawRows(rows: string[][]) {
  if (rows.length === 0) {
    return { headers: [] as string[], body: [] as string[][] }
  }
  return {
    headers: rows[0] || [],
    body: rows.slice(1),
  }
}

export function exportErrorResponse(error: unknown, context: string) {
  const message = error instanceof Error ? error.message : 'Export failed'
  return Response.json(
    {
      error: 'Export failed',
      details: process.env.NODE_ENV === 'development' ? message : undefined,
      context,
    },
    { status: 500 }
  )
}
