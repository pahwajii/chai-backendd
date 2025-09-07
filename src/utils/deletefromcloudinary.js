import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./ApiError.js";

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new ApiError(400, "Missing publicId for Cloudinary deletion");
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true // also clears CDN cache
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw new ApiError(500, `Failed to delete image: ${result.result}`);
    }

    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw new ApiError(500, "Error deleting old image from Cloudinary");
  }
};
