import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/aipError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/apiResponse.js'

const generateAccessAndRefreshToken = async(userId)=>{
    try {

        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken  = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken};
        
    } catch (error) {
        throw new ApiError(500, "Refresh and Acces Token failed to generate")   
    }
}

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

const loginUser = asyncHandler(async (req, res)=>{
    const {email, username, password} = req.body;

    if(!username || !email){
        throw new ApiError(400, "username or password is required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User doesn't exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password, -refreshToken");

    // cookies
    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, 
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "Logged in successfully."
        )
    )
})

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))

})

export {registerUser, loginUser, logoutUser}