import { Request, Response } from 'express';
import axios from 'axios';
import { scrapeAWSService, scrapeCompanyInfo, getSoftwareOneLogo, scrapeByUrl } from '../services/scraperService';
import { searchAWSDocumentation } from '../services/awsDocsService';

const PYTHON_API = process.env.AWS_DOCS_API_URL || 'http://localhost:8001';

export class ScraperController {

  // POST /api/scraper/aws-service
  awsService = async (req: Request, res: Response) => {
    try {
      const { serviceName } = req.body;
      if (!serviceName || typeof serviceName !== 'string')
        return res.status(400).json({ success: false, error: 'serviceName es requerido' });

      const name = serviceName.trim();
      let data: any = null;

      try {
        data = await searchAWSDocumentation(name);
      } catch {
        data = await scrapeAWSService(name);
      }

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET /api/scraper/extraer
  extraer = async (req: Request, res: Response) => {
    try {
      const { url, force } = req.query;
      if (!url || typeof url !== 'string')
        return res.status(400).json({ success: false, error: 'url es requerida' });

      const forceRefresh = force === '1' || force === 'true';
      let data: any = null;

      try {
        const pyRes = await axios.get(`${PYTHON_API}/extraer`, {
          params: { url: url.trim(), force: forceRefresh },
          timeout: 40000,
        });
        data = pyRes.data;
      } catch {
        data = await scrapeByUrl(url.trim());
      }

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // POST /api/scraper/by-url
  byUrl = async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string')
        return res.status(400).json({ success: false, error: 'url es requerida' });

      const cleanUrl = url.trim();
      let data: any = null;

      if (cleanUrl.includes('aws.amazon.com') || cleanUrl.includes('docs.aws.amazon.com')) {
        try {
          const pyRes = await axios.get(`${PYTHON_API}/extraer`, { params: { url: cleanUrl }, timeout: 40000 });
          data = pyRes.data;
        } catch { /* fallback below */ }
      }

      if (!data) data = await scrapeByUrl(cleanUrl);

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST /api/scraper/company-info
  companyInfo = async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string')
        return res.status(400).json({ success: false, error: 'url de la empresa es requerida' });
      const data = await scrapeCompanyInfo(url.trim());
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET /api/scraper/softwareone-logo
  softwareOneLogo = async (_req: Request, res: Response) => {
    try {
      const logoData = await getSoftwareOneLogo();
      res.json({ success: true, data: { logo: logoData } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Error al obtener el logo de SoftwareOne' });
    }
  };
}
