import { OpportunityController } from '../OpportunityController';
import { Request, Response } from 'express';

describe('OpportunityController - Unit Tests', () => {
  let controller: OpportunityController;

  beforeEach(() => {
    controller = new OpportunityController();
  });

  // Helper to create mock request
  const createMockRequest = (body: any = {}, query: any = {}, params: any = {}, files: any = {}): Partial<Request> => ({
    body,
    query,
    params,
    files,
  });

  // Helper to create mock response
  const createMockResponse = (): Partial<Response> => {
    const res: any = {
      statusCode: 200,
      jsonData: null,
    };
    res.status = jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn((data: any) => {
      res.jsonData = data;
      return res;
    });
    return res;
  };

  describe('analyze endpoint', () => {
    test('returns 400 when mpaFile is missing', async () => {
      const req = createMockRequest({}, {}, {}, {
        mraFile: [{ buffer: Buffer.from('test'), originalname: 'test.pdf', mimetype: 'application/pdf', size: 100 }],
      });
      const res = createMockResponse();

      await controller.analyze(req as Request, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('mpaFile');
    });

    test('returns 400 when mraFile is missing', async () => {
      const req = createMockRequest({}, {}, {}, {
        mpaFile: [{ buffer: Buffer.from('test'), originalname: 'test.xlsx', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 100 }],
      });
      const res = createMockResponse();

      await controller.analyze(req as Request, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('mraFile');
    });

    test('returns 400 when both files are missing', async () => {
      const req = createMockRequest({}, {}, {}, {});
      const res = createMockResponse();

      await controller.analyze(req as Request, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toBeDefined();
    });

    test('returns 400 when MPA file exceeds 50MB', async () => {
      const req = createMockRequest({}, {}, {}, {
        mpaFile: [{ buffer: Buffer.alloc(100), originalname: 'test.xlsx', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 51 * 1024 * 1024 }],
        mraFile: [{ buffer: Buffer.from('test'), originalname: 'test.pdf', mimetype: 'application/pdf', size: 100 }],
      });
      const res = createMockResponse();

      await controller.analyze(req as Request, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('50MB');
    });

    test('returns 400 when MRA file exceeds 50MB', async () => {
      const req = createMockRequest({}, {}, {}, {
        mpaFile: [{ buffer: Buffer.from('test'), originalname: 'test.xlsx', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 100 }],
        mraFile: [{ buffer: Buffer.alloc(100), originalname: 'test.pdf', mimetype: 'application/pdf', size: 51 * 1024 * 1024 }],
      });
      const res = createMockResponse();

      await controller.analyze(req as Request, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('50MB');
    });
  });

  describe('list endpoint', () => {
    test('returns 400 when sessionId is missing', async () => {
      const req = createMockRequest({}, {}, {});
      const res = createMockResponse();

      await controller.list(req as Request, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('sessionId');
    });

    test('returns empty list for unknown sessionId', async () => {
      const req = createMockRequest({}, { sessionId: 'unknown-session-id' }, {});
      const res = createMockResponse();

      await controller.list(req as Request, res as Response);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.opportunities).toEqual([]);
      expect(res.jsonData.data.total).toBe(0);
    });

    test('parses priority filter correctly', async () => {
      const req = createMockRequest({}, { sessionId: 'test-session', priority: 'High,Medium' }, {});
      const res = createMockResponse();

      await controller.list(req as Request, res as Response);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
    });

    test('parses ARR filters correctly', async () => {
      const req = createMockRequest({}, { sessionId: 'test-session', minARR: '10000', maxARR: '500000' }, {});
      const res = createMockResponse();

      await controller.list(req as Request, res as Response);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
    });

    test('parses status filter correctly', async () => {
      const req = createMockRequest({}, { sessionId: 'test-session', status: 'Nueva,En Progreso' }, {});
      const res = createMockResponse();

      await controller.list(req as Request, res as Response);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
    });

    test('parses search term correctly', async () => {
      const req = createMockRequest({}, { sessionId: 'test-session', search: 'migration' }, {});
      const res = createMockResponse();

      await controller.list(req as Request, res as Response);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
    });
  });

  describe('updateStatus endpoint', () => {
    test('returns 400 when status is missing', async () => {
      const req = createMockRequest({}, {}, { id: 'test-id' });
      const res = createMockResponse();

      await controller.updateStatus(req as Request, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('Status');
    });

    test('returns 400 for invalid status value', async () => {
      const req = createMockRequest({ status: 'InvalidStatus' }, {}, { id: 'test-id' });
      const res = createMockResponse();

      await controller.updateStatus(req as Request, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('Invalid status');
    });

    test('accepts valid status values', async () => {
      const validStatuses = ['Nueva', 'En Progreso', 'Ganada', 'Perdida', 'Descartada'];

      for (const status of validStatuses) {
        const req = createMockRequest({ status }, {}, { id: 'test-id' });
        const res = createMockResponse();

        await controller.updateStatus(req as Request, res as Response);

        // Will return 404 since opportunity doesn't exist, but status validation passed
        expect([404, 500]).toContain(res.statusCode);
      }
    });

    test('returns 404 for non-existent opportunity', async () => {
      const req = createMockRequest({ status: 'Nueva' }, {}, { id: 'non-existent-id' });
      const res = createMockResponse();

      await controller.updateStatus(req as Request, res as Response);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('not found');
    });
  });
});
