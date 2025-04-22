import { MikroORM, RequestContext } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import baseOptions from '../config/mikro-orm.config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TenantManager {
  private tenantOrmInstances = new Map<string, MikroORM>();
  private baseOrm: MikroORM | null = null;

  async getBaseORM(): Promise<MikroORM> {
    if (!this.baseOrm) {
      this.baseOrm = await MikroORM.init(baseOptions);
    }
    return this.baseOrm;
  }

  async getTenantORM(tenantId: string): Promise<MikroORM> {
    if (!this.tenantOrmInstances.has(tenantId)) {
      // Create a new database for this tenant if it doesn't exist
      const baseOrm = await this.getBaseORM();
      const connection = baseOrm.em.getConnection();
      
      try {
        // Check if the tenant database exists
        const result = await connection.execute(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          [`tenant_${tenantId}`]
        );

        // If the database doesn't exist, create it
        if (result.length === 0) {
          await connection.execute(`CREATE DATABASE tenant_${tenantId}`);
          console.log(`Created new database for tenant: tenant_${tenantId}`);
        }
      } catch (error: any) {
        console.error(`Error checking/creating tenant database: ${error.message}`);
      }

      // Initialize tenant ORM
      const tenantOptions = {
        ...baseOptions,
        dbName: `tenant_${tenantId}`,
        migrations: {
          tableName: 'mikro_orm_migrations_tenant',
          path: './dist/migrations/tenant',
          pathTs: './src/migrations/tenant',
        }
      };

      const orm = await MikroORM.init(tenantOptions);
      
      // Run migrations to ensure the schema is up to date
      try {
        const migrator = orm.getMigrator();
        await migrator.up();
        console.log(`Migrations applied for tenant ${tenantId}`);
      } catch (error: any) {
        console.log(`Migrations not applied for tenant ${tenantId}: ${error.message}`);
        console.log(`Creating schema manually for tenant ${tenantId}...`);
        
        // Initialize the schema manually for tenant
        try {
          console.log('Creating tenant schema manually...');
          const schemaPath = path.resolve(__dirname, '..', '..', 'src', 'schema.sql');
          const schema = fs.readFileSync(schemaPath, 'utf8');
          
          // Split into individual statements and execute them
          const statements = schema.split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
          
          const tenantConnection = orm.em.getConnection();
          
          for (const statement of statements) {
            try {
              await tenantConnection.execute(statement);
            } catch (err: any) {
              console.warn(`Warning executing statement for tenant: ${err.message}`);
            }
          }
          
          console.log(`Schema created successfully for tenant ${tenantId}`);
        } catch (schemaError: any) {
          console.error(`Error creating schema for tenant ${tenantId}:`, schemaError.message);
        }
      }

      this.tenantOrmInstances.set(tenantId, orm);
    }
    
    return this.tenantOrmInstances.get(tenantId)!;
  }

  // Utility method to run operations in the context of a tenant
  async runInTenantContext<T>(tenantId: string, callback: (em: any) => Promise<T>): Promise<T> {
    const orm = await this.getTenantORM(tenantId);
    const em = orm.em.fork();
    
    return RequestContext.create(em, () => callback(em));
  }

  // Clean up resources when shutting down
  async closeConnections(): Promise<void> {
    if (this.baseOrm) {
      await this.baseOrm.close();
    }
    
    for (const [_, orm] of this.tenantOrmInstances.entries()) {
      await orm.close();
    }
  }
} 