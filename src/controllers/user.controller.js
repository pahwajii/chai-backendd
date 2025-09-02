import { log } from "console";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// const registerUser = asyncHandler(async(req,res)=> {
//     return res.status(200).json({
//         message:"chai piyoge"
//     })
// ye hamne bas test ke liye ek req bhjej ke dekhi thi

// })
//many steps to do register user 
const registerUser = asyncHandler(async(req,res)=> {
    //get user details form frontend
    //validation (name_empty, email_right/wrong,not-empty check krenge yhn ham)
    //check if user alreadty exists:username ,email uniqueness
    //check for images , check for avatar
    //upload them to cloudinary
    //create user object - create entry in db
    //remove password and efresh token field from response 
    //check for user creation 
    //return response

    const {fullName, email , username , password} = req.body
    console.log('====================================');
    console.log("email:",email);
    console.log("password", password);
    
    console.log('====================================');
    // if (fullName === ""){
    //     throw new ApiError(400,"fullName is required")
    // } //begineers do like this 
    /**
     * Wraps all four fields into an array.

    Uses .some() to test each element.

    field?.trim() === "" → ensures that after trimming spaces, the field is not an empty string.

    The ?. protects against undefined or null.

    If any field is empty, .some() returns true. Otherwise, it returns false.
     */
    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"ALL FIELDS ARE REQUIRED")
    }
    if (!email.includes("@")) {
        throw new ApiError(400, "EMAIL MUST INCLUDE @")
    }

    const existeduser = User.findOne({
        $or:[ {username} , {email} ]
    })
    if(existeduser){
        throw new ApiError(409,"USERNAME OR EMAIL IS ALREADY IN USE")
    }

    // req.body ke andar sara ka sara data aata hai 
    //as we have put middleware in routes thus it gives us more access in "req.things"so we get access to files //multer gives access of req.files
    const avatarLocalPath = req.files?.avatar[0]?.path// this gives a check on avatar's first property of multer that is the path decided for files that is stored in diskstorage go refer to multer.middleware.js
    const coverImagePath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400 , "AVATAR FILE IS REQUIRED")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    if(!avatar){
        throw new ApiError(400 , "AVATAR FILE IS REQUIRED")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createduser = await User.findById(user._id)
    .select(
        "-password -refreshToken"
    )

    if(!createduser){
        throw new ApiError(500 , "something went wrong while creating the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createduser,"User regidtered successfully")
    )
})


// const loginUser = asyncHandler(async(req,res)=>
// {
//     res
// })

export {registerUser}