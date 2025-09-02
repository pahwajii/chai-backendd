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
        fullname:{
            type : String,
            required : true,
            trim : true,   
            index : true,
        },
        avatar:{
            type : String,//cloudinary url 
            required : true,
        },
        coverimage :{
            type : String,//cloudinary URL

        },
        watchhistory:[{
            type:Schema.Types.ObjectId,
            ref : "Video"
        }],
        passoword :{
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
userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();


    this.passoword = await bcrypt.hash(this.passoword,10)//bcrypt.hash(what to encrypt,how many rounds)
    next()
})//isse hamare har ek action per dikkat ho skti hai baar baar computer  password ko hash krke store kr rha hai jo ki bekar hai jab pass change ho tbhi ho ye sab bhi to ham isliye ek if condition lagadenge 


userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
    jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username:this.username,
            fullname :this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env,ACCESS_TOKEN_EXPIRY
        }
    )

}
userSchema.methods.generateAccessToken = async function(){
    jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username:this.username,
            fullname :this.fullname,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.
            REFRESH_TOKEN_EXPIRY
        }
    )

}

export const User = mongoose.model("User", userSchema)