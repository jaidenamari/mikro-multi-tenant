# Farm Tenants - Multi-Tenant Database Example

This project demonstrates a multi-tenant database setup using MikroORM, PostgreSQL, and Express. It's a prototype application, using a Community Supported Agriculture example, where each farm organization gets its own isolated database.

## Features

- **Multi-tenant architecture**: Each farm organization has its own database
- **Shared codebase**: Single application instance serving multiple tenants
- **Dynamic tenant creation**: New tenant databases are created on-demand
- **Automatic schema migrations**: Schema changes are applied to all tenant databases
- **Tenant identification**: Via HTTP headers or hostname

## Project Structure

- `src/entities`: Database entity models (Organization, User, Crop, Harvest)
- `src/services`: Business logic services, including TenantManager
- `src/routes`: API routes for organizations, crops, and harvests
- `src/middleware`: Express middleware, including tenant identification
- `src/migrations`: Database migrations for base and tenant-specific schemas
- `src/config`: Application configuration files
- `docker`: Docker-related utilities like the wait-for-it script

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

### Running with Docker

1. Clone the repository
2. Navigate to the project directory
3. Run `docker-compose up`
4. The API will be available at http://localhost:3000

### Local Development

1. Install dependencies: `npm install`
2. Create a `.env` file with database credentials (see `.env.example`)
3. Start a PostgreSQL database: `docker-compose up postgres`
4. Run migrations: `npm run migrate:up`
5. Seed the database: `npm run seed:farms`
6. Start the development server: `npm run dev`

### Testing Migrations

To test that migrations work correctly across all tenant databases:

1. Make sure your PostgreSQL database is running
2. Run `npm run test:migrations`

This will:
- Find all existing tenant databases
- Apply any pending migrations to each tenant
- Verify that the migrations executed successfully
- Create a test tenant if no tenants exist

## API Endpoints

### Organization Management (non-tenant specific)

- `GET /organizations` - List all organizations
- `GET /organizations/:id` - Get organization details
- `POST /organizations` - Create a new organization/tenant
- `PUT /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization

### Tenant-Specific Endpoints

These endpoints require a tenant context, identified by the `x-tenant-id` header or the hostname.

- `GET /api/crops` - List all crops for the tenant
- `GET /api/crops/:id` - Get crop details
- `POST /api/crops` - Create a new crop
- `PUT /api/crops/:id` - Update crop
- `DELETE /api/crops/:id` - Delete crop

- `GET /api/harvests` - List all harvests for the tenant
- `GET /api/harvests/:id` - Get harvest details
- `POST /api/harvests` - Create a new harvest
- `PUT /api/harvests/:id` - Update harvest
- `DELETE /api/harvests/:id` - Delete harvest

## Testing Multi-Tenancy

To test the multi-tenant functionality:

1. Create farm tenants via POST to `/farms`
2. Access tenant data via the `/api/*` endpoints with the `x-tenant-id` header set to the tenant ID

Example:
```bash
# Create a new farm tenant
curl -X POST http://localhost:3000/farms \
  -H "Content-Type: application/json" \
  -d '{"name": "Green Valley Co-op", "farmType": "mixed"}'

# Add a crop for the tenant
curl -X POST http://localhost:3000/api/crops \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: green-valley-co-op" \
  -d '{"name": "Heirloom Tomatoes", "plantingDate": "2023-03-15"}'
``` 
