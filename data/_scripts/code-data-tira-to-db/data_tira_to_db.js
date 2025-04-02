const fs = require('fs');
const readline = require('readline');
const { MongoClient } = require('mongodb');

// Configuración de MongoDB
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'db_app_hdi';

// Rutas de los archivos
const rutaDiebold = process.argv[2] // './data/_scripts/code-data-tira-to-db/pull-tira/sbmdebst10_auth_tira_die031725.rpt';
const rutaNCR = process.argv[3] // './data/_scripts/code-data-tira-to-db/pull-tira/sbmdebst10_auth_tira_ncr031725.rpt';

// Función principal
async function procesarArchivos() {
  let client;
  try {
    // Conectar a MongoDB
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log('Conectado a MongoDB');

    const db = client.db(dbName);
    const coleccionDiebold = db.collection('tira_diebold');
    const coleccionNCR = db.collection('tira_ncr');

    // Procesar archivos
    console.log('Procesando archivo Diebold...');
    await procesarArchivo(rutaDiebold, coleccionDiebold, 'diebold');

    console.log('Procesando archivo NCR...');
    await procesarArchivo(rutaNCR, coleccionNCR, 'ncr');

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

// Función para procesar cada archivo
async function procesarArchivo(rutaArchivo, coleccion, tipo) {
  return new Promise((resolve, reject) => {
    // Crear interfaz de lectura por líneas
    const rl = readline.createInterface({
      input: fs.createReadStream(rutaArchivo),
      crlfDelay: Infinity
    });

    let tiraActual = [];
    let numeroCajeroActual = null;
    let tirasAgrupadas = {};

    // Procesar línea por línea
    rl.on('line', (linea) => {
      // Extraer número de cajero según el formato del archivo
      let numeroCajero = extraerNumeroCajero(linea, tipo);

      if (numeroCajero) {
        // Si encontramos un número de cajero y ya teníamos uno anterior diferente
        if (numeroCajeroActual && numeroCajeroActual !== numeroCajero) {
          // Guardar la tira anterior en el objeto de tiras agrupadas
          if (!tirasAgrupadas[numeroCajeroActual]) {
            tirasAgrupadas[numeroCajeroActual] = [];
          }
          tirasAgrupadas[numeroCajeroActual] = tirasAgrupadas[numeroCajeroActual].concat(tiraActual);
          tiraActual = [];
        }
        numeroCajeroActual = numeroCajero;
      }

      // Agregar línea a la tira actual
      tiraActual.push(linea);
    });

    // Al finalizar la lectura del archivo
    rl.on('close', async () => {
      try {
        // Guardar la última tira si existe
        if (numeroCajeroActual && tiraActual.length > 0) {
          if (!tirasAgrupadas[numeroCajeroActual]) {
            tirasAgrupadas[numeroCajeroActual] = [];
          }
          tirasAgrupadas[numeroCajeroActual] = tirasAgrupadas[numeroCajeroActual].concat(tiraActual);
        }

        // Guardar todas las tiras en MongoDB
        const operaciones = [];
        for (const [numeroCajero, tira] of Object.entries(tirasAgrupadas)) {
          operaciones.push({
            updateOne: {
              filter: { numeroCajero },
              update: { $set: { numeroCajero, tira, fechaProcesamiento: new Date() } },
              upsert: true
            }
          });
        }

        if (operaciones.length > 0) {
          const resultado = await coleccion.bulkWrite(operaciones);
          console.log(`${tipo}: ${resultado.upsertedCount} documentos insertados, ${resultado.modifiedCount} documentos actualizados`);
        } else {
          console.log(`No se encontraron tiras para procesar en el archivo ${tipo}`);
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });

    rl.on('error', (error) => {
      reject(error);
    });
  });
}

// Función para extraer el número de cajero de una línea
function extraerNumeroCajero(linea, tipo) {
  if (tipo === 'diebold' || tipo === 'ncr') {
    // Buscar patrones como "MF_PLZESPAN 03/17/25 11:04 7915 7341" o "SUC_PTARIO5 03/17/25 05:41 7218 6334"
    // donde el último número (7341 o 6334) es el número real del cajero
    const matchLinea = linea.match(/[A-Z_]+\d*\s+\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}\s+(\d+)\s*(\d*)/);
    if (matchLinea) {
      const primerNumero = matchLinea[1];
      const segundoNumero = matchLinea[2]?.trim();

      // Caso 1: Formato normal - último número es el cajero y tiene 4 dígitos
      if (segundoNumero && segundoNumero.length === 4) {
        return segundoNumero;
      }

      // Caso 2: Número de cajero incompleto (ejemplo: "9" en lugar de "9968")
      if (segundoNumero && segundoNumero.length === 1) {
        return null; // Se manejará en el código principal comparando con cajeros anteriores/posteriores
      }

      // Caso 3: Número mezclado (ejemplo: "01968" donde "0196" es transacción y "8" es parte del cajero)
      if (primerNumero.length > 4) {
        const posibleCajero = primerNumero.slice(-4);
        if (/^\d{4}$/.test(posibleCajero)) {
          return posibleCajero;
        }
      }

      // Caso 4: Primer número es el cajero y tiene 4 dígitos
      if (primerNumero.length === 4) {
        return primerNumero;
      }
    }

    // Si no encontramos el patrón anterior, verificamos si es una línea de asteriscos
    const matchAsteriscos = linea.match(/\*+\s+(\d+)\s+\*+/);
    if (matchAsteriscos) {
      return null; // No extraemos el número de las líneas de asteriscos
    }
  }
  return null;
}

// Ejecutar la función principal
procesarArchivos().catch(console.error);
