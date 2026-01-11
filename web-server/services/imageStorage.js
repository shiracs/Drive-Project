import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create images directory if it doesn't exist
const IMAGES_DIR = path.join(__dirname, '../../image_storage');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Save an image (base64 content) to file system
 * @param {string} imageId - Unique ID for the image
 * @param {string} base64Content - Base64 encoded image content
 * @returns {boolean} - Success status
 */
export const saveImage = (imageId, base64Content) => {
  try {
    const filePath = path.join(IMAGES_DIR, imageId);
    fs.writeFileSync(filePath, base64Content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving image:', error);
    return false;
  }
};

/**
 * Read an image from file system
 * @param {string} imageId - Unique ID for the image
 * @returns {string|null} - Base64 content or null if not found
 */
export const readImage = (imageId) => {
  try {
    const filePath = path.join(IMAGES_DIR, imageId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading image:', error);
    return null;
  }
};

/**
 * Delete an image from file system
 * @param {string} imageId - Unique ID for the image
 * @returns {boolean} - Success status
 */
export const deleteImage = (imageId) => {
  try {
    const filePath = path.join(IMAGES_DIR, imageId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Check if an image exists
 * @param {string} imageId - Unique ID for the image
 * @returns {boolean} - Exists status
 */
export const imageExists = (imageId) => {
  const filePath = path.join(IMAGES_DIR, imageId);
  return fs.existsSync(filePath);
};
