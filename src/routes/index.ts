import { Router, Request, Response, NextFunction } from 'express';
import { createOrganizationRoutes } from './organizationRoutes.js';
import { createCropRoutes } from './cropRoutes.js';
import { createHarvestRoutes } from './harvestRoutes.js';
import { TenantManager } from '../services/TenantManager.js';
import { tenantMiddleware } from '../middleware/tenantMiddleware.js';

export const setupRoutes = (tenantManager: TenantManager) => {
  const router = Router();

  // Non-tenant routes (for organization/tenant management)
  router.use('/organizations', createOrganizationRoutes(tenantManager));
  router.use('/farms', createOrganizationRoutes(tenantManager)); // Alias for organizations

  // Tenant-specific routes (require tenant context)
  const tenantRouter = Router();
  
  // Create and apply tenant middleware
  const tenantMiddlewareHandler = tenantMiddleware(tenantManager);
  tenantRouter.use((req: Request, res: Response, next: NextFunction) => {
    tenantMiddlewareHandler(req, res, next);
  });
  
  tenantRouter.use('/crops', createCropRoutes());
  tenantRouter.use('/harvests', createHarvestRoutes());

  router.use('/api', tenantRouter);

  return router;
}; 