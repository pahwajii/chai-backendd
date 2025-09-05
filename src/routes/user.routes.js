import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
//add a middleware by just adding router.route("/your route").post(middleware,action)
/*Here’s what happens:

middleware runs first when a POST request hits /your-route.

If middleware calls next(), then action (your controller/handler) runs.

If middleware sends a response or throws an error, action won’t execute. */
router.route("/register").post(
    upload.fields([
        {
            name :"avatar", // frontend me bhi yehi name hona chhiye 
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),
    registerUser
)
//http://localhost:8000/api/v1/users => http://localhost:8000/api/v1/users/register

router.route("/login").post(
    loginUser
)
// secured routes 
router.route("/logout").post(verifyJWT,
    logoutUser
)

// router.route("/login").post(loginUser)
// //http://localhost:8000/api/v1/users => http://localhost:8000/api/v1/users/login

export default router