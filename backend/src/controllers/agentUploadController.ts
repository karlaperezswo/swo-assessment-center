import { Request, Response } from 'express';
import { DependencyService } from '../services/dependencyService';
import { getMpaSessionStore } from '../services/MpaSessionStore';
import { getAuditLog } from '../services/AuditLogService';

const dependencyService = new DependencyService();

export class AgentUploadController {
  /**
   * POST /api/agent/uploads/mpa
   * multipart/form-data:
   *   - file:      Excel/CSV with Migration Portfolio Assessment data
   *   - sessionId: target session (required)
   *
   * Parses the file server-side, stores it under the session, and returns
   * a compact summary the chat UI can echo as a system note. The agent's
   * `get_dependency_graph` tool reads from the same store on the next turn.
   */
  uploadMpa = async (req: Request, res: Response): Promise<void> => {
    const sessionId =
      (req.body?.sessionId as string | undefined) ??
      (req.query?.sessionId as string | undefined);

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }
    if (!sessionId) {
      res.status(400).json({ success: false, error: 'sessionId is required' });
      return;
    }

    const user = req.user;

    try {
      const data = dependencyService.parseDependencyFile(req.file.buffer);
      await getMpaSessionStore().put(sessionId, {
        sessionId,
        filename: req.file.originalname || 'mpa.xlsx',
        uploadedAt: new Date().toISOString(),
        data,
      });

      await getAuditLog().record({
        action: 'agent:upload-mpa',
        resource: `session:${sessionId}`,
        actor: {
          userId: user?.sub ?? 'anonymous',
          orgId: user?.orgId,
          role: user?.role,
          ip: req.ip,
        },
        status: 'success',
        metadata: {
          filename: req.file.originalname,
          sizeBytes: req.file.size,
          servers: data.servers.size,
          dependencies: data.dependencies.length,
        },
      });

      res.json({
        success: true,
        data: {
          sessionId,
          filename: req.file.originalname,
          summary: {
            servers: data.servers.size,
            applications: data.applications.size,
            dependencies: data.dependencies.length,
            databases: data.databases.length,
            ...data.summary,
          },
          message:
            'MPA cargado. Ya puedes pedirle al agente "muéstrame las waves" o ' +
            '"dame el cluster del servidor X".',
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'parse error';
      await getAuditLog().record({
        action: 'agent:upload-mpa',
        resource: `session:${sessionId}`,
        actor: {
          userId: user?.sub ?? 'anonymous',
          orgId: user?.orgId,
          role: user?.role,
          ip: req.ip,
        },
        status: 'failure',
        metadata: { error: message, filename: req.file?.originalname },
      });
      res.status(400).json({ success: false, error: message });
    }
  };

  /** DELETE /api/agent/uploads/mpa/:sessionId — clears the stored MPA. */
  clearMpa = async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({ success: false, error: 'sessionId required' });
      return;
    }
    await getMpaSessionStore().clear(sessionId);
    res.json({ success: true });
  };
}
