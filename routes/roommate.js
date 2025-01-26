import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {deleteRoommateRequest, editRoommateRequest, getAllLocation, getAllRoommates, getAllUserRoommateRequests, getRoommateRequest, joinRoommateRequest, newRoommateRequest} from "../controllers/roommate.js"

const app = express.Router();

app.get("/all",getAllRoommates);
app.get("/locations",getAllLocation);
app.use(isAuthenticated);
app.post("/new",newRoommateRequest);
app.get("/my",getAllUserRoommateRequests);
app.put("/join/:id",joinRoommateRequest);
app.route("/:id").put(editRoommateRequest).delete(deleteRoommateRequest).get(getRoommateRequest)

export default app;