import { Request, Response } from 'express';
import { DependencyService, DependencySearchResult } from '../services/dependencyService';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const dependencyService = new DependencyService();

// Store parsed data in memory (in production, use Redis or database)
const dependencyCache = new Map<string, any>();

export const uploadDependencyFile = [
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó archivo',
        });
      }

      const data = dependencyService.parseDependencyFile(req.file.buffer);
      const graph = dependencyService.buildDependencyGraph(data.dependencies);

      // Store in cache with session ID
      const sessionId = Date.now().toString();
      dependencyCache.set(sessionId, data);

      res.json({
        success: true,
        data: {
          sessionId,
          summary: data.summary,
          graph,
          servers: Array.from(data.servers),
          applications: Array.from(data.applications),
          allDependencies: data.dependencies,
          databases: data.databases,
          databasesWithoutDependencies: data.databasesWithoutDependencies,
        },
      });
    } catch (error) {
      console.error('Error parsing dependency file:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar archivo',
      });
    }
  },
];

export const searchDependencies = async (req: Request, res: Response) => {
  try {
    const { sessionId, searchTerm } = req.body;

    if (!sessionId || !searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere sessionId y searchTerm',
      });
    }

    const data = dependencyCache.get(sessionId);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada. Por favor, suba el archivo nuevamente.',
      });
    }

    const result = dependencyService.searchDependencies(data, searchTerm);

    if (!result) {
      return res.json({
        success: true,
        data: null,
        message: 'No se encontraron resultados',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error searching dependencies:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error en búsqueda',
    });
  }
};

export const exportDependencies = async (req: Request, res: Response) => {
  try {
    const { sessionId, searchTerm, format } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere sessionId',
      });
    }

    const data = dependencyCache.get(sessionId);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada.',
      });
    }

    let result: DependencySearchResult;
    if (searchTerm) {
      const searchResult = dependencyService.searchDependencies(data, searchTerm);
      if (!searchResult) {
        return res.status(404).json({
          success: false,
          error: 'No se encontraron datos para exportar',
        });
      }
      result = searchResult;
    } else {
      // Export all dependencies
      result = {
        server: 'Todas las dependencias',
        dependencies: {
          incoming: [],
          outgoing: data.dependencies,
        },
        relatedServers: Array.from(data.servers),
        relatedApplications: Array.from(data.applications),
        graph: dependencyService.buildDependencyGraph(data.dependencies),
      };
    }

    const { buffer, filename, mimeType } = await dependencyService.exportToDocument(result, data.summary, format || 'pdf');
    
    // Send file as binary download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting dependencies:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al exportar',
    });
  }
};
