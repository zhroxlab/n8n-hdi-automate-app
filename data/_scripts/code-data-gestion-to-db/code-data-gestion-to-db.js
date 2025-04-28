const { MongoClient } = require('mongodb');

const rawJson = process.argv[2];

if (!rawJson) {
  console.error('No se recibió JSON');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(rawJson);
} catch (err) {
  console.error('Error al parsear JSON:', err.message);
  process.exit(1);
}

const url = 'mongodb://zhrox:admin@localhost:27017';
const dbName = 'db_app_hdi';
const collectionName = 'data_gestion';

async function run() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Limpiar colección
    await collection.deleteMany({});

    // Convertir cada { jsonX: {...} } en un documento independiente
    const docs = Object.entries(data).map(([key, value]) => ({
      [key]: value
    }));

    await collection.insertMany(docs);

    console.log('Documentos insertados correctamente');
  } catch (err) {
    console.error('Error al insertar:', err);
  } finally {
    await client.close();
  }
}

run();
