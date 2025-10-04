import { DataSource } from 'typeorm';

interface Property {
  id: number;
  images: string[] | null;
  image: string | null;
}

async function updateImagePaths() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'immo_db',
    entities: [],
  });

  await dataSource.initialize();

  // Get all properties
  const properties = await dataSource.query('SELECT * FROM properties');

  for (const prop of properties) {
    const updates: any = {};

    if (prop.images && Array.isArray(prop.images)) {
      updates.images = JSON.stringify(
        prop.images.map((img: string) => img.replace('/properties/', '/public/properties/'))
      );
    }

    if (prop.image) {
      updates.image = prop.image.replace('/properties/', '/public/properties/');
    }

    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map(key => {
        if (key === 'images') {
          return `${key} = '${updates[key]}'::jsonb`;
        }
        return `${key} = '${updates[key]}'`;
      }).join(', ');

      await dataSource.query(`UPDATE properties SET ${setClauses} WHERE id = ${prop.id}`);
      console.log(`Updated property ${prop.id}`);
    }
  }

  console.log('Image paths updated successfully!');
  await dataSource.destroy();
}

updateImagePaths().catch(console.error);
