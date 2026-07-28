import { get, set, del } from 'idb-keyval';

/**
 * Guarda un archivo en IndexedDB usando su ID como clave.
 * @param fileId ID único del archivo
 * @param base64Data Cadena base64 completa del archivo (data:...)
 */
export async function saveMediaFile(fileId: string, base64Data: string): Promise<void> {
  try {
    await set(`media_file_${fileId}`, base64Data);
  } catch (error) {
    console.error(`Error al guardar archivo ${fileId} en IndexedDB:`, error);
    throw error;
  }
}

/**
 * Obtiene un archivo guardado en IndexedDB.
 * @param fileId ID del archivo
 * @returns La cadena base64 del archivo o undefined si no existe
 */
export async function getMediaFile(fileId: string): Promise<string | undefined> {
  try {
    return await get<string>(`media_file_${fileId}`);
  } catch (error) {
    console.error(`Error al recuperar archivo ${fileId} de IndexedDB:`, error);
    return undefined;
  }
}

/**
 * Elimina un archivo de IndexedDB.
 * @param fileId ID del archivo
 */
export async function deleteMediaFile(fileId: string): Promise<void> {
  try {
    await del(`media_file_${fileId}`);
  } catch (error) {
    console.error(`Error al eliminar archivo ${fileId} de IndexedDB:`, error);
  }
}
