import { Migration } from '@mikro-orm/migrations';

export class Migration20230621001_TestTenantMigration extends Migration {
  async up(): Promise<void> {
    this.addSql('CREATE TABLE IF NOT EXISTS "migration_test" (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), test_name VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now())');
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "migration_test"');
  }
} 