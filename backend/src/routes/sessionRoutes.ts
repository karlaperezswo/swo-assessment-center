import { Router } from 'express';
import { getSession, putSession, deleteSession } from '../controllers/sessionController';

export const sessionRouter = Router();

sessionRouter.get('/', getSession);
sessionRouter.put('/', putSession);
sessionRouter.delete('/', deleteSession);
