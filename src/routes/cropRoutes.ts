import { Router, Request, Response, RequestHandler } from 'express';
import { TenantRequest } from '../middleware/tenantMiddleware.js';
import { Crop, Organization } from '../entities/index.js';

export const createCropRoutes = () => {
  const router = Router();

  // Get all crops for the tenant
  router.get('/', (async (req: Request, res: Response) => {
    try {
      const { tenantORM, tenantId } = req as TenantRequest;
      const em = tenantORM.em.fork();
      const crops = await em.find(Crop, {});
      
      res.json(crops);
    } catch (error) {
      console.error(`Error fetching crops: ${error}`);
      res.status(500).json({ message: 'Error fetching crops' });
    }
  }) as RequestHandler);

  // Get crop by ID
  router.get('/:id', (async (req: Request, res: Response) => {
    try {
      const { tenantORM } = req as TenantRequest;
      const em = tenantORM.em.fork();
      const crop = await em.findOne(Crop, { id: req.params.id });
      
      if (!crop) {
        return res.status(404).json({ message: 'Crop not found' });
      }
      
      res.json(crop);
    } catch (error) {
      console.error(`Error fetching crop: ${error}`);
      res.status(500).json({ message: 'Error fetching crop' });
    }
  }) as RequestHandler);

  // Create a new crop
  router.post('/', (async (req: Request, res: Response) => {
    try {
      const { name, plantingDate } = req.body;
      const { tenantORM, tenantId } = req as TenantRequest;
      const em = tenantORM.em.fork();
      
      if (!name || !plantingDate) {
        return res.status(400).json({ message: 'Name and plantingDate are required' });
      }

      // Create an organization for the tenant if it doesn't exist
      const org = new Organization();
      org.name = tenantId;
      org.farmType = 'mixed';
      
      try {
        await em.persistAndFlush(org);
        console.log(`Created new organization for tenant ${tenantId}`);
      } catch (error: any) {
        // Organization might already exist, this is fine
        console.log(`Organization might already exist for tenant ${tenantId}: ${error.message}`);
      }
      
      // Find or get the first organization
      let organization: Organization | null = null;
      
      try {
        // Try to find by name
        organization = await em.findOne(Organization, { name: tenantId });
      } catch (error: any) {
        console.log(`Error finding organization by name: ${error.message}`);
        // Fall back to getting any organization
        const orgs = await em.find(Organization, {}, { limit: 1 });
        if (orgs.length > 0) {
          organization = orgs[0];
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: 'No organization found for tenant' });
      }

      // Create the crop entity
      const crop = new Crop();
      crop.name = name;
      crop.plantingDate = new Date(plantingDate);
      crop.organization = organization;
      
      await em.persistAndFlush(crop);
      
      res.status(201).json(crop);
    } catch (error) {
      console.error(`Error creating crop: ${error}`);
      res.status(500).json({ message: 'Error creating crop' });
    }
  }) as RequestHandler);

  // Update crop
  router.put('/:id', (async (req: Request, res: Response) => {
    try {
      const { name, plantingDate } = req.body;
      const { tenantORM } = req as TenantRequest;
      const em = tenantORM.em.fork();
      const crop = await em.findOne(Crop, { id: req.params.id });
      
      if (!crop) {
        return res.status(404).json({ message: 'Crop not found' });
      }
      
      if (name) crop.name = name;
      if (plantingDate) crop.plantingDate = new Date(plantingDate);
      
      await em.persistAndFlush(crop);
      
      res.json(crop);
    } catch (error) {
      console.error(`Error updating crop: ${error}`);
      res.status(500).json({ message: 'Error updating crop' });
    }
  }) as RequestHandler);

  // Delete crop
  router.delete('/:id', (async (req: Request, res: Response) => {
    try {
      const { tenantORM } = req as TenantRequest;
      const em = tenantORM.em.fork();
      const crop = await em.findOne(Crop, { id: req.params.id });
      
      if (!crop) {
        return res.status(404).json({ message: 'Crop not found' });
      }
      
      await em.removeAndFlush(crop);
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting crop: ${error}`);
      res.status(500).json({ message: 'Error deleting crop' });
    }
  }) as RequestHandler);

  return router;
}; 