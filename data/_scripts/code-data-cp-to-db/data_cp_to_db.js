const { MongoClient } = require('mongodb');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuración de MongoDB
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'db_app_hdi';

// Obtener la ruta del archivo desde los argumentos de la línea de comandos
const rutaCP = process.argv[2];

if (!rutaCP) {
  console.error('Error: Debe proporcionar la ruta del archivo Excel como argumento');
  console.error('Ejemplo: node data_cp_to_db.js ./data/_cp/cp.xlsx');
  process.exit(1);
}

// Verificar si el archivo existe
const absoluteFilePath = path.isAbsolute(rutaCP)
  ? rutaCP
  : path.resolve(process.cwd(), rutaCP);

console.log(`Verificando archivo en: ${absoluteFilePath}`);

if (!fs.existsSync(absoluteFilePath)) {
  console.error(`Error: El archivo no existe en la ruta: ${absoluteFilePath}`);
  process.exit(1);
}

// Función principal
async function procesarArchivoCP() {
  let client;
  try {
    // Conectar a MongoDB
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log('Conectado a MongoDB');

    const db = client.db(dbName);
    const coleccionCP = db.collection('date_cp');

    // Leer el archivo Excel
    console.log(`Procesando archivo: ${absoluteFilePath}`);
    const workbook = XLSX.readFile(absoluteFilePath);
    const sheetName = workbook.SheetNames[0]; // Obtener el nombre de la primera hoja
    const worksheet = workbook.Sheets[sheetName];

    // Convertir el Excel a JSON
    const datos = XLSX.utils.sheet_to_json(worksheet);

    // Procesar y guardar los datos en MongoDB
    if (datos.length > 0) {
      const operaciones = datos.map(dato => ({
        updateOne: {
          filter: { codigo: dato.codigo }, // Asumiendo que hay un campo 'codigo' como identificador único
          update: {
            $set: {
              ...dato,
              fechaProcesamiento: new Date()
            }
          },
          upsert: true
        }
      }));

      const resultado = await coleccionCP.bulkWrite(operaciones);
      console.log(`CP: ${resultado.upsertedCount} documentos insertados, ${resultado.modifiedCount} documentos actualizados`);
    } else {
      console.log('No se encontraron datos para procesar en el archivo CP');
    }

    console.log('Procesamiento completado');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Conexión a MongoDB cerrada');
    }
  }
}

// Ejecutar la función principal
procesarArchivoCP().catch(console.error);
