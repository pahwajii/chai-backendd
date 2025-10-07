import mongoose , {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const userSchema = new Schema(
    {
        
        username:{
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true,// searching ko optimie krne ke liye ye use hota hai
        },
        email:{
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,   
        },
        fullName:{
            type : String,
            required : true,
            trim : true,   
            index : true,
        },
        avatar: {
            url: {
                type: String
            },
            publicId: {
                type: String
            }
        },
        coverImage: {
            url: {
                type: String
            },
            publicId: {
                type: String
            }
        },
        watchHistory:[{
            type:Schema.Types.ObjectId,
            ref : "Video"
        }],
        password :{
            type : String,
            required: [true, 'PASSWORD is required']
        },
        refreshToken :{
            type : String
        },
    },{
        timestamps:true
    }
)

//POINT TO REMEMBER:
//  userSchema.pre("save",()=>{})//we dont use call back like this because as in prehook we need the reference of what we need to change thus we use it like // and we use async as pre would take some time to do its fucntionalities
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10); // fixed typo
    next();
});
//isse hamare har ek action per dikkat ho skti hai baar baar computer  password ko hash krke store kr rha hai jo ki bekar hai jab pass change ho tbhi ho ye sab bhi to ham isliye ek if condition lagadenge 


userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username:this.username,
            fullName :this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)
