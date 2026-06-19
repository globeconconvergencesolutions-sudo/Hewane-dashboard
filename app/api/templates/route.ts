import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { appendTemplateRow, getAllTemplates } from '@/lib/sheet-data'
import { MessageTemplate } from '@/lib/types'
import logger, { errorLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug('[API] GET /api/templates called')

    const templates = await getAllTemplates()

    logger.info(`[API] Returned ${templates.length} templates`)
    return NextResponse.json(templates)
  } catch (error) {
    errorLogger('[API] GET /api/templates error', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    logger.debug('[API] POST /api/templates called', { name: body.name })

    const templateId = `template_${Date.now()}`

    const newTemplate: MessageTemplate = {
      id: templateId,
      name: body.name,
      body: body.body,
      variables: body.variables || [],
      createdAt: new Date(),
    }

    await appendTemplateRow([
      templateId,
      body.name,
      body.body,
      JSON.stringify(body.variables || []),
      new Date().toISOString(),
    ])

    logger.info('[API] Template created', newTemplate)
    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    errorLogger('[API] POST /api/templates error', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
