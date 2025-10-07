import { Router } from "express";
import {
    addToWatchHistory,
    changeCurrentPassword,
    getCurrentuser,
    getUserchannelprofile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
    }
    from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";

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

router
.route("/refresh-token")
.post(refreshAccessToken)

router
.route("/change-password")
.post(
    verifyJWT,
    changeCurrentPassword
)

router
.route("/current-user")
.get(
    verifyJWT,
    getCurrentuser
)

router
.route("/update-acc-details")
.patch(
    verifyJWT, 
    updateAccountDetails
) 
// Using PATCH instead of POST because we only want to update specific fields 
// of the account, not overwrite all details at once.


router
.route("/update-avatar")
.patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)
//first middleware we used verifyjwt so that we know user is logged in 
//secondmiddleware we used upload the multer one middleware

router
.route("/update-cover")
.patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
)

router
.route("/c/:username")
.get(
    optionalVerifyJWT,
    getUserchannelprofile
)
/*The route is /c/:username because:
:username lets you dynamically fetch any user’s channel.
/c/ prefix avoids conflicts with other routes and makes it clear the endpoint is about channels (inspired by YouTube’s style).
*/

router
.route("/watch-history/:videoId")
.post(verifyJWT, addToWatchHistory)

router
.route("/History")
.get(verifyJWT,getWatchHistory)



export default router