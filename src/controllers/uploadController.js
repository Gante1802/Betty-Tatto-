const {
  uploadImageByType,
  deleteImageByPublicId,
} = require("../services/cloudinaryUpload");

async function uploadFrontendImage(req, res, next) {
  try {
    const result = await uploadImageByType(req.file, "frontend");

    return res.status(201).json({
      message: "Imagen de frontend subida correctamente.",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function uploadPublicationImage(req, res, next) {
  try {
    const result = await uploadImageByType(req.file, "publicacion");

    return res.status(201).json({
      message: "Imagen de publicacion subida correctamente.",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function uploadClientReferenceImage(req, res, next) {
  try {
    const result = await uploadImageByType(req.file, "referencia_cliente");

    return res.status(201).json({
      message: "Imagen de referencia del cliente subida correctamente.",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteImage(req, res, next) {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      throw new Error("Debes enviar publicId para eliminar la imagen.");
    }

    const result = await deleteImageByPublicId(publicId);

    return res.status(200).json({
      message: "Solicitud de eliminacion enviada a Cloudinary.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadFrontendImage,
  uploadPublicationImage,
  uploadClientReferenceImage,
  deleteImage,
};
