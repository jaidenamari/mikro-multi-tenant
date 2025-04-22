import { Router, Request, Response, RequestHandler } from 'express';
import { TenantRequest } from '../middleware/tenantMiddleware.js';
import { Harvest, Crop, Organization, HarvestUnit } from '../entities/index.js';

export const createHarvestRoutes = () => {
  const router = Router();

  // Get all harvests for the tenant
  router.get('/', (async (req: Request, res: Response) => {
    try {
      const { tenantORM } = req as TenantRequest;
      const em = tenantORM.em.fork();
      const harvests = await em.find(Harvest, {}, { populate: ['crop'] });
      
      res.json(harvests);
    } catch (error) {
      console.error(`Error fetching harvests: ${error}`);
      res.status(500).json({ message: 'Error fetching harvests' });
    }
  }) as RequestHandler);

  // Get harvest by ID
  router.get('/:id', (async (req: Request, res: Response) => {
    try {
      const { tenantORM } = req as TenantRequest;
      const em = tenantORM.em.fork();
      const harvest = await em.findOne(Harvest, { id: req.params.id }, { populate: ['crop'] });
      
      if (!harvest) {
        return res.status(404).json({ message: 'Harvest not found' });
      }
      
      res.json(harvest);
    } catch (error) {
      console.error(`Error fetching harvest: ${error}`);
      res.status(500).json({ message: 'Error fetching harvest' });
    }
  }) as RequestHandler);

  // Create a new harvest
  router.post('/', (async (req: Request, res: Response) => {
    try {
      const { quantity, unit, cropId } = req.body;
      const { tenantORM, tenantId } = req as TenantRequest;
      const em = tenantORM.em.fork();
      
      if (!quantity || !unit || !cropId) {
        return res.status(400).json({ 
          message: 'Quantity, unit, and cropId are required' 
        });
      }

      // Find the organization for the tenant
      let organization: Organization | null = null;
      
      try {
        // Try to find by tenant ID first
        organization = await em.findOne(Organization, { name: tenantId });
      } catch (error) {
        console.log("Error finding organization by name:", error);
      }
      
      if (!organization) {
        try {
          // Fall back to getting any organization
          const orgs = await em.find(Organization, {}, { limit: 1 });
          if (orgs.length > 0) {
            organization = orgs[0];
          } else {
            // Create an organization if none exists
            const org = new Organization();
            org.name = tenantId;
            org.farmType = 'mixed';
            
            await em.persistAndFlush(org);
            organization = org;
          }
        } catch (error) {
          console.log("Error getting or creating organization:", error);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found and could not be created' });
      }

      // Find the crop for this harvest
      const crop = await em.findOne(Crop, { id: cropId });
      
      if (!crop) {
        return res.status(404).json({ message: 'Crop not found' });
      }

      // Create the harvest entity
      const harvest = new Harvest();
      harvest.quantity = Number(quantity);
      harvest.unit = unit as HarvestUnit;
      harvest.crop = crop;
      harvest.organization = organization;
      
      await em.persistAndFlush(harvest);
      
      res.status(201).json({
        ...harvest,
        crop: {
          id: crop.id,
          name: crop.name
        }
      });
    } catch (error) {
      console.error(`Error creating harvest: ${error}`);
      res.status(500).json({ message: 'Error creating harvest' });
    }
  }) as RequestHandler);

  // Update harvest
  router.put('/:id', (async (req: Request, res: Response) => {
    try {
      const { quantity, unit, cropId } = req.body;
      const { tenantORM } = req as TenantRequest;
      const em = tenantORM.em.fork();
      const harvest = await em.findOne(Harvest, { id: req.params.id }, { populate: ['crop'] });
      
      if (!harvest) {
        return res.status(404).json({ message: 'Harvest not found' });
      }
      
      if (quantity) harvest.quantity = Number(quantity);
      if (unit) harvest.unit = unit as HarvestUnit;
      
      if (cropId) {
        const crop = await em.findOne(Crop, { id: cropId });
        if (!crop) {
          return res.status(404).json({ message: 'Crop not found' });
        }
        harvest.crop = crop;
      }
      
      await em.persistAndFlush(harvest);
      
      res.json(harvest);
    } catch (error) {
      console.error(`Error updating harvest: ${error}`);
      res.status(500).json({ message: 'Error updating harvest' });
    }
  }) as RequestHandler);

  // Delete harvest
  router.delete('/:id', (async (req: Request, res: Response) => {
    try {
      const { tenantORM } = req as TenantRequest;
      const em = tenantORM.em.fork();
      const harvest = await em.findOne(Harvest, { id: req.params.id });
      
      if (!harvest) {
        return res.status(404).json({ message: 'Harvest not found' });
      }
      
      await em.removeAndFlush(harvest);
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting harvest: ${error}`);
      res.status(500).json({ message: 'Error deleting harvest' });
    }
  }) as RequestHandler);

  return router;
}; 