import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {deleteLearnerRequest, editLearnerRequest, getAllLearners, getAllUserJoinedLearnerRequests, getAllUserLearnerRequests, getLearnerRequest, joinLearner, newLearnerRequest,linkReqToExistingProject, addMemberToLearner, removeMemberFromLearner} from "../controllers/learner.js";

const app = express.Router();

app.get("/all",getAllLearners)
app.get("/get/:id",getLearnerRequest)
app.use(isAuthenticated);
app.post("/new",newLearnerRequest);
app.get("/my",getAllUserLearnerRequests);
app.get("/joined",getAllUserJoinedLearnerRequests);
app.put("/join/:id",joinLearner);
app.put("/link/:id",linkReqToExistingProject)
app.put("/add/:id",addMemberToLearner);
app.put("/remove/:id",removeMemberFromLearner);
app.route("/:id").put(editLearnerRequest).delete(deleteLearnerRequest)

export default app;