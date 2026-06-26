import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try { 
        if (!localFilePath) return null;

        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            chunk_size: 6000000, // 6MB chunks for large files
            timeout: 60000, // 60 seconds timeout
            eager: [
                { width: 300, height: 300, crop: "pad" },
                { width: 160, height: 100, crop: "crop", gravity: "south" }
            ],
            eager_async: true
        });

        // File uploaded successfully
        // console.log("File uploaded on Cloudinary:", result.url);


        // Remove local temp file
        fs.unlinkSync(localFilePath);

        return result;  // result.url will have the uploaded file URL

    } catch (error) {
        // Remove local temp file if upload failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload error:", error);
        return null;
    }
};

export { uploadOnCloudinary };
