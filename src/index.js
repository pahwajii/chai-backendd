// require ('dotenv').config({ path: './env'})//
import dotenv from "dotenv"

import connectDB from "./db/index.js"

dotenv.config({
    path:"./env"
})


connectDB()


























// this whole is one way to write the code and connect to the data base
// =====================================================================
// import express from "express"
// const app = express()

// // function connectDB(){

// // }
// // connectDB()

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("ERROR:",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`app is listening on port ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.error("ERROR: ",error)
//         throw error
//     }
// } )()//use " ; " before function to avoid mistakes of other 



