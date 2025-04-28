const { MongoClient } = require('mongodb');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Obtener la ruta del archivo desde los argumentos de la línea de comandos
const filePath = process.argv[2];

if (!filePath) {
  console.error('No se proporcionó la ruta del archivo Excel');
  console.error('Uso: node code-data-gestion-to-db.js ./ruta/al/archivo.xlsx');
  process.exit(1);
}

// Verificar si el archivo existe
const absoluteFilePath = path.isAbsolute(filePath)
  ? filePath
  : path.resolve(process.cwd(), filePath);

console.log(`Verificando archivo en: ${absoluteFilePath}`);

if (!fs.existsSync(absoluteFilePath)) {
  console.error(`Error: El archivo no existe en la ruta: ${absoluteFilePath}`);
  process.exit(1);
}

// Configuración de MongoDB
const url = 'mongodb://localhost:27017';
const dbName = 'db_app_hdi';
const collectionName = 'data_gestion';

// Función para normalizar los nombres de campos y valores (eliminar espacios al inicio y final)
function normalizeObjectKeys(obj) {
  const normalizedObj = {};

  for (const [key, value] of Object.entries(obj)) {
    // Normalizar la clave eliminando espacios al inicio y final
    const normalizedKey = key.trim();

    // Si el valor es un objeto, normalizar recursivamente
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      normalizedObj[normalizedKey] = normalizeObjectKeys(value);
    }
    // Si el valor es un string, eliminar espacios al inicio y final
    else if (typeof value === 'string') {
      normalizedObj[normalizedKey] = value.trim();
    }
    // Para otros tipos de datos, mantener el valor original
    else {
      normalizedObj[normalizedKey] = value;
    }
  }

  return normalizedObj;
}

// Función principal
async function run() {
  let client;
  try {
    // Leer el archivo Excel
    console.log(`Procesando archivo: ${absoluteFilePath}`);
    const workbook = XLSX.readFile(absoluteFilePath);
    const sheetName = workbook.SheetNames[0]; // Primera hoja
    const worksheet = workbook.Sheets[sheetName];

    // Convertir Excel a JSON
    let rawData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Leídos ${rawData.length} registros del archivo Excel`);

    // Normalizar los campos y valores en cada registro
    rawData = rawData.map(item => normalizeObjectKeys(item));
    console.log('Campos y valores normalizados (espacios eliminados)');

    // Simular la lógica de $input.all() de la muestra
    const inputItems = rawData;

    // Aplicar exactamente la misma lógica de transformación que en el ejemplo
    const transformedDocs = inputItems.map((item, index) => {
      const key = `json${index}`;
      return {
        [key]: Object.assign({}, item) // Equivalente a item.json en el ejemplo
      };
    });

    // Conectar a MongoDB
    client = new MongoClient(url);
    await client.connect();
    console.log('Conectado a MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Limpiar colección
    await collection.deleteMany({});

    // Insertar los documentos transformados directamente
    const result = await collection.insertMany(transformedDocs);

    console.log(`Se guardaron ${result.insertedCount} documentos en la base de datos`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (client) {
      await client.close();
      console.log('Conexión a MongoDB cerrada');
    }
  }
}

// Ejecutar la función principal
run().catch(console.error);
