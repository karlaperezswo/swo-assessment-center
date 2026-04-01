import { Router } from 'express';
import { ScraperController } from '../controllers/scraperController';

const router = Router();
const controller = new ScraperController();

router.post('/aws-service', controller.awsService);
router.post('/by-url', controller.byUrl);
router.get('/extraer', controller.extraer);
router.get('/consulta', controller.consulta);
router.get('/leer-pagina', controller.leerPagina);
router.post('/company-info', controller.companyInfo);
router.get('/softwareone-logo', controller.softwareOneLogo);

export { router as scraperRouter };
