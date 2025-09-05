import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token){
            throw new ApiError(401, "unauthorized request")
        }
     
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)// agar verify ho jayega to hame decoded info mil jayegi 
    
        const user = await User.findById(decodedToken._id)
        .select("-password -refreshToken")
        //hamne jwt.verify se decoded val mil gyi thii isliye hamne decoded._id se id nikal li
    
    
        if(!user){
            //todo discuss about frontend
            throw new ApiError(401,"invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401,error?.message||"invalid access token")
    }



})

// key : value
// authoriztion : bearer <token   >