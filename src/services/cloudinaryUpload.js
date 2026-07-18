const cloudinary = require("../config/cloudinary");
const CLOUDINARY_FOLDERS = require("../constants/cloudinaryFolders");

function uploadImageBuffer(fileBuffer, options = {}) {
  const { folder, publicId, tags = [] } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: "image",
      folder,
      tags,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
}

async function uploadImageByType(file, imageType) {
  if (!file || !file.buffer) {
    throw new Error("No se recibio una imagen valida para subir.");
  }

  const folderByType = {
    frontend: CLOUDINARY_FOLDERS.FRONTEND,
    publicacion: CLOUDINARY_FOLDERS.PUBLICACIONES,
    referencia_cliente: CLOUDINARY_FOLDERS.REFERENCIAS_CLIENTES,
  };

  const folder = folderByType[imageType];

  if (!folder) {
    throw new Error(
      "Tipo de imagen no valido. Usa: frontend, publicacion o referencia_cliente.",
    );
  }

  return uploadImageBuffer(file.buffer, {
    folder,
    tags: ["betty_tatto", imageType],
  });
}

function deleteImageByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}

module.exports = {
  uploadImageBuffer,
  uploadImageByType,
  deleteImageByPublicId,
};
