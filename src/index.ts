import express from 'express';
import { TenantManager } from './services/TenantManager.js';
import { setupRoutes } from './routes/index.js';
import { env } from './config/env.js';
import { MikroORM } from '@mikro-orm/core';
import config from './config/mikro-orm.config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  try {
    // Initialize MikroORM
    console.log('Initializing MikroORM...');
    const orm = await MikroORM.init(config);
    
    // Run migrations if available
    try {
      const migrator = orm.getMigrator();
      await migrator.up();
      console.log('Migrations applied successfully');
    } catch (error: any) {
      console.log('Migrations not applied:', error.message);
      console.log('Continuing without migrations, will create schema manually...');
      
      // Initialize the schema manually
      try {
        console.log('Creating schema manually...');
        const schemaPath = path.resolve(__dirname, '..', 'src', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split into individual statements and execute them
        const statements = schema.split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        const connection = orm.em.getConnection();
        
        for (const statement of statements) {
          try {
            await connection.execute(statement);
          } catch (err: any) {
            console.warn(`Warning executing statement: ${err.message}`);
          }
        }
        
        console.log('Schema created successfully');
      } catch (schemaError: any) {
        console.error('Error creating schema:', schemaError.message);
      }
    }
    
    // Create tenant manager
    const tenantManager = new TenantManager();
    
    // Create Express app
    const app = express();
    
    // Middleware
    app.use(express.json());
    
    // Add request logging
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
    
    // Set up routes
    app.use(setupRoutes(tenantManager));
    
    // Simple health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
    
    // Start server
    const PORT = env.PORT;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Multi-tenant Farm Management API is ready!`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down...');
      await tenantManager.closeConnections();
      await orm.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down...');
      await tenantManager.closeConnections();
      await orm.close();
      process.exit(0);
    });
  } catch (error: any) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

bootstrap(); 