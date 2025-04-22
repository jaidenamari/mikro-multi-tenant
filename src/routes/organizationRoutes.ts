import { Router, Request, Response, RequestHandler } from 'express';
import { Organization } from '../entities/index.js';
import { TenantManager } from '../services/TenantManager.js';

export const createOrganizationRoutes = (tenantManager: TenantManager) => {
  const router = Router();

  // Get all organizations
  router.get('/', (async (req: Request, res: Response) => {
    try {
      const baseOrm = await tenantManager.getBaseORM();
      const em = baseOrm.em.fork();
      const organizations = await em.find(Organization, {});
      
      res.json(organizations);
    } catch (error) {
      console.error(`Error fetching organizations: ${error}`);
      res.status(500).json({ message: 'Error fetching organizations' });
    }
  }) as RequestHandler);

  // Get organization by ID
  router.get('/:id', (async (req: Request, res: Response) => {
    try {
      const baseOrm = await tenantManager.getBaseORM();
      const em = baseOrm.em.fork();
      const organization = await em.findOne(Organization, { id: req.params.id });
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      res.json(organization);
    } catch (error) {
      console.error(`Error fetching organization: ${error}`);
      res.status(500).json({ message: 'Error fetching organization' });
    }
  }) as RequestHandler);

  // Create a new organization/tenant
  router.post('/', (async (req: Request, res: Response) => {
    try {
      const { name, farmType, logoUrl } = req.body;
      const baseOrm = await tenantManager.getBaseORM();
      const em = baseOrm.em.fork();
      
      if (!name || !farmType) {
        return res.status(400).json({ message: 'Name and farmType are required' });
      }

      // Check if organization already exists
      const existingOrg = await em.findOne(Organization, { name });
      if (existingOrg) {
        return res.status(409).json({ message: 'Organization already exists' });
      }

      // Create the organization entity
      const organization = new Organization();
      organization.name = name;
      organization.farmType = farmType;
      if (logoUrl) organization.logoUrl = logoUrl;
      
      await em.persistAndFlush(organization);
      
      // Create a tenant ID based on the name for database creation
      const tenantId = name.toLowerCase().replace(/\s+/g, '-');
      
      // Initialize the tenant database
      await tenantManager.getTenantORM(tenantId);
      
      res.status(201).json({
        ...organization,
        tenantId // Return tenantId for client reference, not stored in entity
      });
    } catch (error) {
      console.error(`Error creating organization: ${error}`);
      res.status(500).json({ message: 'Error creating organization' });
    }
  }) as RequestHandler);

  // Update organization
  router.put('/:id', (async (req: Request, res: Response) => {
    try {
      const { name, farmType, logoUrl } = req.body;
      const baseOrm = await tenantManager.getBaseORM();
      const em = baseOrm.em.fork();
      const organization = await em.findOne(Organization, { id: req.params.id });
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      if (name) organization.name = name;
      if (farmType) organization.farmType = farmType;
      if (logoUrl !== undefined) organization.logoUrl = logoUrl;
      
      await em.persistAndFlush(organization);
      
      res.json(organization);
    } catch (error) {
      console.error(`Error updating organization: ${error}`);
      res.status(500).json({ message: 'Error updating organization' });
    }
  }) as RequestHandler);

  // Delete organization
  router.delete('/:id', (async (req: Request, res: Response) => {
    try {
      const baseOrm = await tenantManager.getBaseORM();
      const em = baseOrm.em.fork();
      const organization = await em.findOne(Organization, { id: req.params.id });
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      // TODO: Add logic to drop tenant database
      
      await em.removeAndFlush(organization);
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting organization: ${error}`);
      res.status(500).json({ message: 'Error deleting organization' });
    }
  }) as RequestHandler);

  return router;
}; 