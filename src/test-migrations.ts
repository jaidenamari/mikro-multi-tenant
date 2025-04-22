import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import baseOptions from './config/mikro-orm.config.js';
import { TenantManager } from './services/TenantManager.js';

async function testTenantMigrations() {
  console.log('Testing migrations for all tenant databases...');
  
  // Initialize base ORM
  const baseOrm = await MikroORM.init(baseOptions);
  const connection = baseOrm.em.getConnection();
  
  try {
    // Get a list of all tenant databases
    console.log('Retrieving list of tenant databases...');
    const results = await connection.execute(
      `SELECT datname FROM pg_database WHERE datname LIKE 'tenant_%'`
    );
    
    const tenantDbs = results.map((row: any) => row.datname);
    console.log(`Found ${tenantDbs.length} tenant databases: ${tenantDbs.join(', ')}`);
    
    if (tenantDbs.length === 0) {
      console.log('No tenant databases found. Creating a test tenant...');
      const tenantId = 'test_tenant';
      
      // Create a test tenant
      await connection.execute(`CREATE DATABASE tenant_${tenantId}`);
      console.log(`Created test tenant database: tenant_${tenantId}`);
      
      // Add to the list of tenants to test
      tenantDbs.push(`tenant_${tenantId}`);
    }
    
    // Initialize TenantManager
    const tenantManager = new TenantManager();
    
    // Run migrations for each tenant
    for (const tenantDb of tenantDbs) {
      const tenantId = tenantDb.replace('tenant_', '');
      console.log(`Testing migrations for tenant: ${tenantId}`);
      
      try {
        // Get tenant ORM and run migrations
        const tenantOrm = await tenantManager.getTenantORM(tenantId);
        const migrator = tenantOrm.getMigrator();
        
        // Run the migrations
        const executedMigrations = await migrator.up();
        console.log(`Executed ${executedMigrations.length} migrations for tenant ${tenantId}`);
        
        // Verify migration by checking if the test table exists
        const connection = tenantOrm.em.getConnection();
        const tableExists = await connection.execute(
          `SELECT to_regclass('migration_test') IS NOT NULL as exists`
        );
        
        if (tableExists[0].exists) {
          console.log(`✅ Verification successful: 'migration_test' table exists for tenant ${tenantId}`);
          
          // Insert a test record - Fix parameter binding
          const testName = `Test for ${tenantId} at ${new Date().toISOString()}`;
          await connection.execute(
            `INSERT INTO migration_test (test_name) VALUES ('${testName}')`
          );
          
          // Check if record was inserted
          const records = await connection.execute(`SELECT * FROM migration_test LIMIT 1`);
          console.log(`✅ Inserted test record: `, records[0]);
        } else {
          console.log(`❌ Verification failed: 'migration_test' table does not exist for tenant ${tenantId}`);
        }
      } catch (error: any) {
        console.error(`❌ Error testing migrations for tenant ${tenantId}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error('Error testing tenant migrations:', error.message);
  } finally {
    // Clean up connections
    await baseOrm.close();
  }
}

// Run the test
testTenantMigrations().catch(error => {
  console.error('Unhandled error in migration test:', error);
  process.exit(1);
}).then(() => {
  console.log('Migration test completed.');
  process.exit(0);
}); 