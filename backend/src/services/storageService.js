import supabase from '../config/database.js';
import crypto from 'crypto';

/**
 * Загружает файл в Supabase Storage
 * @param {Buffer} fileBuffer - Буфер файла
 * @param {string} originalName - Оригинальное имя файла
 * @param {string} mimetype - MIME тип файла
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadToSupabase = async (fileBuffer, originalName, mimetype) => {
  try {
    // Генерируем уникальное имя файла
    const fileExt = originalName.split('.').pop();
    const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Загружаем файл в Supabase Storage
    const { data, error } = await supabase.storage
      .from('food-images') // bucket name
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Удаляет файл из Supabase Storage
 * @param {string} filePath - Путь к файлу
 */
export const deleteFromSupabase = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('food-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
    }
  } catch (error) {
    console.error('Delete error:', error);
  }
};
 
export default { uploadToSupabase, deleteFromSupabase };
