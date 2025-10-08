import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// we have imported them all but these are configured app banne ke baad 

const app = express()

// app.use(cors())//configuration for cors there are many other options to be known about cors read documentation
//procuction level\\
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}))

app.use(express.json({limit: "16kb"}))
/*
app.use()

Adds a middleware to your Express app.

Middleware runs before your route handlers, and can modify req and res.

express.json()

Built-in Express middleware.

Parses incoming JSON request bodies and populates req.body with the parsed object.

{ limit: "16kb" }

Sets the maximum allowed size for the JSON body.

// If a client sends a JSON larger than 16 KB, Express will throw an error (PayloadTooLargeError).*/
app.use(express.urlencoded({extended:true,limit :"16kb"}))
/*express.urlencoded()

Parses incoming requests with URL-encoded payloads (like HTML form submissions).

Populates req.body with a JavaScript object.

3. extended: true

Determines how nested objects are handled in URL-encoded data:

true → Uses the qs library, allows deeply nested objects.

false → Uses querystring library, supports only shallow objects.*/

app.use(express.static("public"))
/*/pdf store rkhna chahta hun media aayi koi usme 
ham store krna chahte hai vo publicly using asset hai jokiham har jagh use kr payenge */
app.use(cookieParser())

// app.use((req, res, next) => {
//   console.log("Middleware check:", req.method, req.url);
//   next();
// });
//debug




//routes

import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import dislikeRouter from "./routes/dislike.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"

// Route declaration
// Earlier we directly used app.get/post in app.js.
// Now, for better structure, we separate concerns using routers, controllers, and middlewares.

// - Routers (like userRouter) group related routes together (e.g., all user-related APIs).
// - Controllers contain the business logic for each route.
// - Middlewares handle things like authentication, validation, etc.
// This keeps app.js clean and makes the project scalable.

// By mounting the router with:
//   app.use("/api/v1/users", userRouter)
// All routes inside userRouter will automatically be prefixed with /api/v1/users.
// Example: "/register" in userRouter becomes accessible at
//   http://localhost:8000/api/v1/users/register

app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/dislikes", dislikeRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)

export { app }

// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
//   });
// }
