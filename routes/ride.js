import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { deleteRideRequest, editRideRequest, getAllUserJoinedRides, getAllUserRides, getRideRequest, joinRide, newRideRequest } from "../controllers/ride.js";

const app = express.Router();

app.use(isAuthenticated);
app.post("/new",newRideRequest);
app.get("/my",getAllUserRides);
app.get("/joined",getAllUserJoinedRides);
app.post("/join/:id",joinRide);
app.route("/:id").put(editRideRequest).delete(deleteRideRequest).get(getRideRequest);

export default app;