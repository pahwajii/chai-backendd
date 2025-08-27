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

app.use(express.static)
/*/pdf store rkhna chahta hun media aayi koi usme 
ham store krna chahte hai vo publicly using asset hai jokiham har jagh use kr payenge */
app.use(cookieParser())



export {app}