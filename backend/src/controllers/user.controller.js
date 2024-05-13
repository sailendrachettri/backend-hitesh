import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/aipError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/apiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    // get user details from user
    const {username, password, fullname, email} = req.body
    
    // check for empty fields
    if(
        [fullname, password, username, email].some((fileld)=>
            fileld?.trim() === ""
        )
    ){
        throw new ApiError(400, "All fields are required");
    }

    // check for already exits user
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist.");
    }

    // get access of files - this req.files added by multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required.");
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const cover = await uploadOnCloudinary(coverImageLocalPath);

    
    if(!avatar){
        throw new ApiError(400, "Avatar is required.");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: cover?.url || "",
        email, 
        password,
        username: username.toLowerCase()

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Not able to register user");
    }

    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )
    
})

export {registerUser}