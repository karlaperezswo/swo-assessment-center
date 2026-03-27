import { Router } from 'express';
import { ScraperController } from '../controllers/scraperController';

const router = Router();
const controller = new ScraperController();

router.post('/aws-service', controller.awsService);
router.post('/company-info', controller.companyInfo);
router.get('/softwareone-logo', controller.softwareOneLogo);

export { router as scraperRouter };
