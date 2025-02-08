const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: 'stocks'
    });
    // Remove file from local uploads
    fs.unlinkSync(localFilePath);
    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    // Remove file from local uploads
    if (localFilePath) {
      fs.unlinkSync(localFilePath);
    }
    throw new Error('Error uploading to Cloudinary');
  }
};

const deleteFromCloudinary = async (public_id) => {
  try {
    if (!public_id) return;
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    throw new Error('Error deleting from Cloudinary');
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
