// require ('dotenv').config({ path: './env'})//
import dotenv from "dotenv"
import express from "express";
import { app } from "./app.js";
import connectDB from "./db/index.js"

dotenv.config({
    path:"./env"
})
// const app = express();


app.on("error", (error) => {
    console.error("App encountered an error:", error);
    // Optional: process.exit(1); // Stop the server if critical
});

// 2. Connect to MongoDB and start server
connectDB()
    .then(() => {
        const port = process.env.PORT || 8000;

        const server = app.listen(port, () => {
            console.log(`Server is running at port ${port}`);
        });

        // Forward server errors to app 'error' event
        server.on("error", (err) => {
            app.emit("error", err); // triggers the app.on("error") listener
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed!!!", err);
        // Optional: exit the process if DB connection is critical
        process.exit(1);
    });

// global app-level error handler (for express errors)
// app.use((err, req, res, next) => {
//     console.error("App error:", err.stack);
//     res.status(500).json({ message: "Something went wrong!" });
// });

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



