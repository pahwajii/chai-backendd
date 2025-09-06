import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"


import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // save refresh token to user
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong with the refresh token and access token")
    }
}

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

    const existeduser = await User.findOne({
        $or:[ {username} , {email} ]
    })
    if(existeduser){
        throw new ApiError(409,"USERNAME OR EMAIL IS ALREADY IN USE")
    }

    // req.body ke andar sara ka sara data aata hai 
    //as we have put middleware in routes thus it gives us more access in "req.things"so we get access to files //multer gives access of req.files
    // console.log("req.files:", req.files);//debugging
    const avatarLocalPath = req.files?.avatar[0]?.path
    // this gives a check on avatar's first property of multer that is the path decided for files that is stored in diskstorage go refer to multer.middleware.js
    // console.log("avatarLocalPath:", avatarLocalPath);////debugging

    // const coverImagePath = req.files?.coverImage[0]?.path;
    // kabhi kanhi likhne me glti ho jati hai js me whenw euse ? so we can use direct if else in place of advanced if else

    let coverimagelLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverimagelLocalPath= req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400 , "AVATAR FILE IS REQUIRED")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverimagelLocalPath)

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

    const createdUser = await User.findById(user._id)
    .select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500 , "something went wrong while creating the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})


const loginUser = asyncHandler(async(req,res)=>
{
    //reqbody -> data 
    //username or email 
    // find the user 
    // password check 
    //access and refresh token 
    //send cookies

    // console.log("Req.body:", req.body);
    // console.log("Headers:", req.headers);
// console.log("Body:", req.body);
//debugging

    // const { email, username, password } = req.body;

    // Require either username OR email, and password
    // if (!(username||email)) {
    //     throw new ApiError(400, "Username/email and password are required");
    // }
    const { email, username, password } = req.body || {}
    if (!email && !username) {
    throw new ApiError(400, "Email or username is required")
    }


    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is not correct");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict" // prevents CSRF
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );

})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new : true 
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict" // prevents CSRF
    };

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user LOGGED out"))

})

// here we are creating the accessToken refresh endpoint
// this endpoint is used when the user's accessToken (short-lived) expires
// instead of forcing the user to log in again, we validate their refreshToken (long-lived)
// if the refreshToken is valid and matches the one stored in DB, we issue a new accessToken
// 
// 🔑 Access Token: 
//   - Short-lived (e.g., 10m, 15m)
//   - Sent with each request (usually in headers or cookies)
//   - Proves the user's identity but expires quickly for security
//
// 🔑 Refresh Token: 
//   - Long-lived (e.g., 7d, 30d)
//   - Stored securely (usually as an httpOnly cookie)
//   - Used ONLY to get new accessTokens when they expire
//   - Cannot be used directly to access protected resources
//
// This approach provides both security (short expiry of access token) 
// and good user experience (no need to log in again frequently).
const refreshAccessToken = asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if(!incomingRefreshToken){
            throw new ApiError(401, "unauthorized request")
        }
    
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "invalid refresh token")
        }
    
        if(incomingRefreshToken != user?.refreshToken)  {
            throw new ApiError(401, "refresh token is expired login again ")
        }  
    
        const options= {
            httpOnly: true ,
            secure : true
        }
    
        const {newaccessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",newaccessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {newaccessToken, refreshToken : newrefreshToken},
                "access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,"invalid refresh token")
    }

})



export {registerUser, loginUser,logoutUser,refreshAccessToken}