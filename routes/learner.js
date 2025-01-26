import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {deleteLearnerRequest, editLearnerRequest, getAllLearners, getAllUserJoinedLearnerRequests, getAllUserLearnerRequests, getLearnerRequest, joinLearner, newLearnerRequest,linkReqToExistingProject} from "../controllers/learner.js";

const app = express.Router();

app.get("/all",getAllLearners)
app.get("/:id",getLearnerRequest)
app.use(isAuthenticated);
app.post("/new",newLearnerRequest);
app.get("/my",getAllUserLearnerRequests);
app.get("/joined",getAllUserJoinedLearnerRequests);
app.put("/join/:id",joinLearner);
app.put("/link/:id",linkReqToExistingProject)
app.route("/:id").put(editLearnerRequest).delete(deleteLearnerRequest)

export default app;