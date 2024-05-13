import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localFilePath)=>{
    try{
        // file not found
        if(!localFilePath) return null;

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })

        // file has been uploaded successfully
        // now unlink it from the local temp
        fs.unlinkSync(localFilePath)
        
        return response;

    } catch(err){
        // if not uploaded on cloudinary the remove the locally saved file
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary}