import { Request, Response } from 'express';
import { scrapeAWSService, scrapeCompanyInfo, getSoftwareOneLogo, scrapeByUrl } from '../services/scraperService';
import { searchAWSDocumentation } from '../services/awsDocsService';

export class ScraperController {

  // POST /api/scraper/aws-service
  // Intenta MCP server primero, fallback a scraping web
  awsService = async (req: Request, res: Response) => {
    try {
      const { serviceName } = req.body;
      if (!serviceName || typeof serviceName !== 'string') {
        return res.status(400).json({ success: false, error: 'serviceName es requerido' });
      }
      const name = serviceName.trim();

      let data: any = null;

      // 1. Intentar con MCP server (AWS Documentation oficial)
      try {
        console.log(`[Scraper] Intentando MCP server para: ${name}`);
        data = await searchAWSDocumentation(name);
        console.log(`[Scraper] MCP server exitoso para: ${name}`);
      } catch (mcpErr: any) {
        console.warn(`[Scraper] MCP falló (${mcpErr.message}), usando scraping web...`);
      }

      // 2. Fallback: scraping web de AWS
      if (!data) {
        data = await scrapeAWSService(name);
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('[Scraper] AWS service error:', error.message);
      res.status(500).json({ success: false, error: error.message || 'Error al obtener información del servicio AWS' });
    }
  };

  // POST /api/scraper/by-url
  byUrl = async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'url es requerida' });
      }
      const data = await scrapeByUrl(url.trim());
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('[Scraper] URL scrape error:', error.message);
      res.status(500).json({ success: false, error: error.message || 'Error al extraer información de la URL' });
    }
  };

  // POST /api/scraper/company-info
  companyInfo = async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'url de la empresa es requerida' });
      }
      const data = await scrapeCompanyInfo(url.trim());
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('[Scraper] Company info error:', error.message);
      res.status(500).json({ success: false, error: error.message || 'Error al obtener información de la empresa' });
    }
  };

  // GET /api/scraper/softwareone-logo
  softwareOneLogo = async (_req: Request, res: Response) => {
    try {
      const logoData = await getSoftwareOneLogo();
      res.json({ success: true, data: { logo: logoData } });
    } catch (error: any) {
      console.error('[Scraper] Logo error:', error.message);
      res.status(500).json({ success: false, error: 'Error al obtener el logo de SoftwareOne' });
    }
  };
}
