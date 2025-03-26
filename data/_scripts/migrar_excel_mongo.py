import pandas as pd
from pymongo import MongoClient
import sys
import math

# Verificar que se pasen los argumentos correctos
if len(sys.argv) < 6:
    print("Uso: python migrar_excel_mongo.py <ruta_excel> <mongo_uri> <db_name> <collection_name> <batch_size>")
    sys.exit(1)

# Parámetros recibidos desde n8n o la terminal
file_path = sys.argv[1]  # Ruta del archivo Excel
mongo_uri = sys.argv[2]  # URI de conexión a MongoDB
db_name = sys.argv[3]    # Nombre de la base de datos
collection_name = sys.argv[4]  # Nombre de la colección en MongoDB
batch_size = int(sys.argv[5])  # Tamaño del lote

# Conectar a MongoDB
client = MongoClient(mongo_uri)
db = client[db_name]
collection = db[collection_name]

# Limpiar la colección antes de la inserción
print(f"Eliminando todos los registros de la coleccion {collection_name} en la base {db_name}. ")
collection.delete_many({})
print("Coleccion vaciada correctamente. ")

# Leer el archivo completo
df = pd.read_excel(file_path, engine='openpyxl')

# Convertir fechas a string y manejar NaT
for col in df.select_dtypes(include=['datetime64']):
    df[col] = df[col].astype(str).replace("NaT", None)  # Convertir fechas a texto

# Dividir en lotes
total_rows = len(df)
num_batches = math.ceil(total_rows / batch_size)  # Calcular cuántos lotes habrá

print(f"Procesando {total_rows} filas en {num_batches} lotes de {batch_size} filas cada uno. ")

for i in range(0, total_rows, batch_size):
    batch = df.iloc[i:i + batch_size]  # Extraer un lote de filas
    data = batch.to_dict(orient="records")  # Convertir a JSON
    collection.insert_many(data)  # Insertar en MongoDB
#    print(f"Insertadas {len(data)} filas...")

print("Migracion completada. ")
