import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'immo_db',
});

async function deleteAllProperties() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    await dataSource.query('DELETE FROM properties');
    console.log('All properties deleted successfully');

    await dataSource.destroy();
  } catch (error) {
    console.error('Error deleting properties:', error);
    process.exit(1);
  }
}

deleteAllProperties();
