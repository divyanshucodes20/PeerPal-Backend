import express from "express"
import { checkUser, updateUser } from "../controllers/user.js";


const router=express.Router();

router.post("/new",checkUser);
router.put("/update",updateUser);
router.get("/get",checkUser);


export default router;