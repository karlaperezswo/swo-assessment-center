/**
 * I18nController — POST /api/i18n/translate
 *
 * Uses AWS Bedrock directly (same SDK as BedrockService) to translate
 * UI text dynamically when a static locale file doesn't cover the key.
 *
 * Rules:
 * - Validates and sanitizes input before sending to Bedrock
 * - Preserves AWS service names and technical terms
 * - Returns { translation, targetLanguage, cached: false }
 */

import { Request, Response } from 'express'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
})

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'

const TIMEOUT_MS = parseInt(process.env.BEDROCK_TIMEOUT_MS || '15000', 10)

/** Sanitize text to prevent prompt injection */
function sanitize(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .slice(0, 2000) // hard cap to avoid huge prompts
}

function buildPrompt(
  text: string,
  sourceLang: string,
  targetLang: string,
  context?: string
): string {
  return `You are a professional UI translator for an AWS cloud migration assessment tool.

Translate the following UI text from ${sourceLang} to ${targetLang}.
Context: ${context ?? 'AWS migration assessment tool'}

Rules:
- Return ONLY the translated text, no explanations, no quotes, no extra text
- Preserve AWS service names exactly (e.g. Amazon EC2, Amazon RDS, AWS Bedrock)
- Keep the same tone and formality level as the original
- Preserve any {{variable}} interpolation placeholders unchanged
- Preserve any → arrows or special characters

Text to translate: ${sanitize(text)}`
}

export async function handleTranslate(req: Request, res: Response): Promise<void> {
  const { text, targetLanguage, sourceLanguage = 'es-MX', context } = req.body

  // Validate required fields
  if (!text || typeof text !== 'string' || text.trim() === '') {
    res.status(400).json({ error: '`text` is required and must be a non-empty string' })
    return
  }
  if (!targetLanguage || typeof targetLanguage !== 'string') {
    res.status(400).json({ error: '`targetLanguage` is required' })
    return
  }

  const prompt = buildPrompt(text.trim(), sourceLanguage, targetLanguage, context)

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 512,
      temperature: 0.1, // low temperature for consistent translations
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Bedrock translation timed out')), TIMEOUT_MS)
  )

  try {
    const response = await Promise.race([client.send(command), timeoutPromise])
    const body = JSON.parse(new TextDecoder().decode(response.body))
    const translation: string = body.content?.[0]?.text?.trim() ?? text

    res.json({ translation, targetLanguage, cached: false })
  } catch (err) {
    console.error('[i18n] Bedrock translation error:', err)
    res.status(500).json({ error: 'Translation service unavailable', translation: text })
  }
}
