import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary } from "../utils/deletefromcloudinary.js";
import mongoose from "mongoose";
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
        avatar: {
            url: avatar.secure_url,
            publicId: avatar.public_id
        },
        coverImage: coverImage
            ? {
                url: coverImage.secure_url,
                publicId: coverImage.public_id
            }
            : undefined,
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
            // $set:{
            // refreshToken: undefined}
            $unset:{
                refreshToken: 1//this removes the fiels from document
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

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    // try to add more functionality
    const{oldPassword, newPassword} = req.body
    /*
    from auth middleware 
    
        req.user = user;
        next()
        iska mtlb user to hai to ham req.user ke dwara user ki id nikal sakte hai 
         */
    const user = await User.findById(req.user?._id)
    const ispasswordcorrect = user.isPasswordCorrect(oldPassword)

    if(!ispasswordcorrect){
        throw new ApiError(400,"invalid old password")
    }

    user.password = newPassword
    await user .save({validateBeforeSave : false})
/*await user.save({ validateBeforeSave: false })

user.save() saves the updated user document to MongoDB.

validateBeforeSave: false:

By default, Mongoose runs all schema validations when saving (e.g., required fields, format checks).

Here, we skip validations because:

We are only updating the password.

Other fields may not meet validations temporarily (like optional fields).

We want to avoid unnecessary validation errors.

await ensures that the save operation completes before moving on*/
    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed succcessfully"))
})

const getCurrentuser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current User Fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email}= req.body

    if (!fullName || !email) {
        throw new ApiError(200, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName :fullName,
                email :email
            }
        },
        {new : true }
    ).select("-password -refreshtoken")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const oldUser = await User.findById(req.user?._id)

    // delete old avatar if exists
    if (oldUser?.avatar?.publicId) {
        await deleteFromCloudinary(oldUser.avatar.publicId)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar?.secure_url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
        $set: {
            avatar: {
            url: avatar.secure_url,
            publicId: avatar.public_id
            }
        }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const oldUser = await User.findById(req.user?._id)

    if (oldUser?.coverImage?.publicId) {
        await deleteFromCloudinary(oldUser.coverImage.publicId)
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage?.secure_url) {
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
        $set: {
            coverImage: {
            url: coverImage.secure_url,
            publicId: coverImage.public_id
            }
        }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"))
})

const getUserchannelprofile = asyncHandler(async (req,res)=>{
    const{username}= req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    // User.findById({username})
    //after aggregating the pipelines we get arrays as outputs 
    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {// this is for calculating no. of subscribers
            $lookup:{
                // aesa kyun kia hamne ?? kyunki jab bhi mongodb me kuch save hoga to vo kese save hotahai ??? vo save hota hai all lowercase with a plural value 
                // hamamra model tha "Subscription"=> subscriptions
                from : "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as :"subscribers"
            }
        },
        {// how many the user has subscribed to 
            $lookup:{
                from : "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as :"subscribedto"
            }
        },
        {
            // by addfields we add the following fields to our usermodel
            $addFields:{
                subscriberscount:{
                    $size:"$subscribers"
                    // size helps us to calculate the count of what you want
                    // first pipeline return us with the array of subscribers who are subscribed to that particular user
                    // similarly for subscribed to 
                },
                channelsubscribedtoCount:{
                    $size :"$subscribedto"
                },
                isSubscribed:{
                    $cond:{
                        //for conditioning we use cond
                        //$in object /array dono me check krleta hai ki usme hai ya nhi 
                        if:{$in :[req.user?._id,"$subscribers.subscriber"]},// yhn per hamne object ke andar jaake dekha hai 
                        then :true,
                        else:false
                    },

                },

            }
        },
        {
            $project:{
                // selected cheezo ko project krne ke liye $project use krte hai
                fullName:1,
                username:1,
                subscriberscount:1,
                channelsubscribedtoCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
            }
        }
        
    ])//pipeline aese likhi jaati hai
    console.log(channel);
    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }
    return res.status(200)
    .json(new ApiResponse(200,"USER channel fetched successfully", channel[0]))
})

/*{
1️⃣ Extract username from request params and validate
- Optional chaining (username?.trim()) ensures no error if username is null/undefined
- Throws 400 if username is missing or empty

2️⃣ Aggregation pipeline on User collection
- $match: find user by username (case-insensitive)
- $lookup: join Subscription collection
   - subscribers: who subscribed to this channel
   - subscribedto: channels this user subscribed to
- $addFields: compute derived fields
   - subscriberscount: total subscribers
   - channelsubscribedtoCount: total channels user subscribed to
   - isSubscribed: check if current logged-in user is subscribed
- $project: select only required fields for response

3️⃣ Check if aggregation returned a user
- channel?.length uses optional chaining
- !channel?.length evaluates true if array is empty or null/undefined
- Throws 404 if no channel found

4️⃣ Send response
- Uses standardized ApiResponse for consistent API response format
}*/

// const getWatchHistory= asyncHandler(async(req,res)=>{
//     const user = await User.aggregate([
//         {
//             $match:{
//                 _id:new mongoose.Types.ObjectId
//             }
//         },
//         {
//             $lookup:{
//                 from:"videos",
//                 localField:"watchHistory",
//                 foreignField:"_id",
//                 as:"watchHistory",
//                 pipeline:[
//                 {
//                     $lookup:{
//                         from:"users",
//                         localField:"owner",
//                         foreignField:"_id",
//                         as:"owner",
//                         pipeline:[
//                             {
//                                 $project:{
//                                     fullName:1,
//                                     username:1,
//                                     avatar:1,
//                                 }
//                             }
//                         ]
//                     }
//                 },
//                 {
//                     $addFields:{
//                         owner:{
//                             $first:"$owner"
//                         }
//                     }
//                 }
//             ]
// /**Here’s the full summary in simple terms:
// Why $first is used
// $lookup always returns an array.
// But each video can have only one owner.
// $first converts that single-element array into an object → makes API response cleaner.
// Without $first
// Frontend has to write video.owner[0].username.
// With $first, it’s just video.owner.username.
// Bad data case (multiple owners matched)
// $lookup could return multiple users (due to duplicates or corruption).
// $first ensures only the first one is picked, so your API response stays consistent with the "one owner" expectation. */ 
//             }
//         }
//     ])
//     return res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             user[0].watchHistory,
//             "watch History fetched Successfully"
//         )
//     )
// })
const getWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id; // coming from auth middleware

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: No user ID" });
  }

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
  ]);

  if (!user || user.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      user[0].watchHistory || [],
      "Watch history fetched successfully"
    )
  );
});


export {
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentuser, 
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserchannelprofile,
    getWatchHistory
}