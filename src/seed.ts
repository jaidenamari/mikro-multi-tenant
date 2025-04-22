import { MikroORM } from '@mikro-orm/core';
import { Organization } from './entities/index.js';
import { TenantManager } from './services/TenantManager.js';
import config from './config/mikro-orm.config.js';

const demoFarms = [
  {
    name: "Sunny Meadows Organic",
    farmType: "vegetable" as const,
    tenantId: "sunny-meadows-organic",
    crops: ["Cilantro", "Blueberries", "Carrots"]
  },
  {
    name: "Pronkin Goat Dairy",
    farmType: "dairy" as const,
    tenantId: "pronkin-goat-dairy",
    crops: ["Alfalfa", "Goat Milk"]
  }
];

async function seed() {
  try {
    console.log('Starting seed process...');
    
    // Initialize base ORM
    const orm = await MikroORM.init(config);
    console.log('Connected to base database');
    
    const tenantManager = new TenantManager();
    const baseOrm = await tenantManager.getBaseORM();
    
    // Clear existing organizations
    await baseOrm.em.nativeDelete(Organization, {});
    console.log('Cleared existing organizations');
    
    // Create demo farms
    for (const farm of demoFarms) {
      console.log(`Creating farm: ${farm.name}`);
      
      // Create organization in base DB
      const organization = new Organization();
      organization.name = farm.name;
      organization.farmType = farm.farmType;
      
      await baseOrm.em.persistAndFlush(organization);
      console.log(`Organization created with ID: ${organization.id}`);
      
      // Set up tenant database
      const tenantOrm = await tenantManager.getTenantORM(farm.tenantId);
      
      // Create organization record in tenant database too
      const tenantOrganization = new Organization();
      tenantOrganization.name = farm.name;
      tenantOrganization.farmType = farm.farmType;
      await tenantOrm.em.persistAndFlush(tenantOrganization);
      
      console.log(`Tenant database initialized for: ${farm.tenantId}`);
    }
    
    console.log('Seed completed successfully!');
    
    // Close connections
    await tenantManager.closeConnections();
    await orm.close();
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seed(); 