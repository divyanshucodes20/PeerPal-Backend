import express from "express";
import {
  adminLogin,
  adminLogout,
  allChats,
  allLearners,
  allMessages,
  allProjects,
  allRides,
  allRoommates,
  allUsers,
  deleteLearnerRequest,
  deleteRideRequest,
  deleteRoommateRequest,
  getAdminData,
  getDashboardStats,
} from "../controllers/admin.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post("/verify", adminLoginValidator(), validateHandler, adminLogin);

app.get("/logout", adminLogout);

// Only Admin Can Accecss these Routes

app.use(adminOnly);

app.get("/", getAdminData);

app.get("/users", allUsers);
app.get("/chats", allChats);
app.get("/messages", allMessages);
app.get("/rides",allRides);
app.get("/roommates",allRoommates);
app.get("/learners",allLearners);
app.get("/projects",allProjects);
app.delete("/roommates/:id",deleteRoommateRequest);
app.delete("/ride/:id",deleteRideRequest);
app.delete("/learner/:id",deleteLearnerRequest);

app.get("/stats", getDashboardStats);

export default app;
