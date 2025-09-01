import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser)
//http://localhost:8000/api/v1/users => http://localhost:8000/api/v1/users/register

// router.route("/login").post(loginUser)
// //http://localhost:8000/api/v1/users => http://localhost:8000/api/v1/users/login

export default router