import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { deleteRideRequest, editRideRequest, friendsOtherThanRideMembers, getAllDestination, getAllRideRequests, getAllSource, getAllUserJoinedRides, getAllUserRides, getRideRequest, joinRide, leaveRide, newRideRequest, removeMemberFromRide } from "../controllers/ride.js";

const app = express.Router();

app.get("/all",getAllRideRequests);
app.get("/source",getAllSource);
app.get("/destination",getAllDestination);
app.get("/get/:id",getRideRequest);
app.use(isAuthenticated);
app.post("/new",newRideRequest);
app.put("/remove/:id",removeMemberFromRide);
app.get("/my",getAllUserRides);
app.get("/joined",getAllUserJoinedRides);
app.put("/join/:id",joinRide);
app.get("/other-members/:id",friendsOtherThanRideMembers);
app.get("/leave/:id",leaveRide);
app.route("/:id").put(editRideRequest).delete(deleteRideRequest)

export default app;