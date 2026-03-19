import { Router } from 'express'
import { handleTranslate } from '../controllers/i18n/I18nController'

export const i18nRouter = Router()

// POST /api/i18n/translate
i18nRouter.post('/translate', handleTranslate)
