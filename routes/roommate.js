import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {deleteRoommateRequest, editRoommateRequest, getAllUserRoommateRequests, getRoommateRequest, joinRoommateRequest, newRoommateRequest} from "../controllers/roommate.js"

const app = express.Router();

app.use(isAuthenticated);
app.post("/new",newRoommateRequest);
app.get("/my",getAllUserRoommateRequests);
app.post("/join/:id",joinRoommateRequest);
app.route("/:id").put(editRoommateRequest).delete(deleteRoommateRequest).get(getRoommateRequest);

export default app;