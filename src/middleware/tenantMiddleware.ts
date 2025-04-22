import { Request, Response, NextFunction } from 'express';
import { TenantManager } from '../services/TenantManager.js';

export interface TenantRequest extends Request {
  tenantId: string;
  tenantORM: any;
}

export const tenantMiddleware = (tenantManager: TenantManager) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Extract tenant ID from header or hostname
    const tenantId = req.headers['x-tenant-id'] as string || 
                    req.hostname.split('.')[0];
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant identification required' });
    }

    try {
      // Get ORM instance for this tenant
      const tenantORM = await tenantManager.getTenantORM(tenantId);
      
      // Add tenant info to request object
      (req as TenantRequest).tenantId = tenantId;
      (req as TenantRequest).tenantORM = tenantORM;
      
      next();
    } catch (error) {
      console.error(`Error initializing tenant context: ${error}`);
      res.status(500).json({ message: 'Error initializing tenant context' });
    }
  };
}; 