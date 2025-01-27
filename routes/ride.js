import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { deleteRideRequest, editRideRequest, getAllDestination, getAllRideRequests, getAllSource, getAllUserJoinedRides, getAllUserRides, getRideRequest, joinRide, newRideRequest } from "../controllers/ride.js";

const app = express.Router();

app.get("/all",getAllRideRequests);
app.get("/source",getAllSource);
app.get("/destination",getAllDestination);
app.get("/:id",getRideRequest);
app.use(isAuthenticated);
app.post("/new",newRideRequest);
app.put("/remove/:id",deleteRideRequest);
app.get("/my",getAllUserRides);
app.get("/joined",getAllUserJoinedRides);
app.put("/join/:id",joinRide);
app.route("/:id").put(editRideRequest).delete(deleteRideRequest)

export default app;