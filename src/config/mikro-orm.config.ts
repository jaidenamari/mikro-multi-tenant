import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { env } from './env.js';
import { Organization, User, Crop, Harvest } from '../entities/index.js';

const options: Options<PostgreSqlDriver> = {
  entities: [Organization, User, Crop, Harvest],
  dbName: env.DB_NAME,
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  driver: PostgreSqlDriver,
  debug: env.NODE_ENV === 'development',
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
};

export default options; 