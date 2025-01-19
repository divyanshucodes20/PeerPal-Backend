import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {deleteLearnerRequest, editLearnerRequest, getAllUserJoinedLearnerRequests, getAllUserLearnerRequests, getLearnerRequest, joinLearner, newLearnerRequest} from "../controllers/learner.js";

const app = express.Router();

app.use(isAuthenticated);
app.post("/new",newLearnerRequest);
app.get("/my",getAllUserLearnerRequests);
app.get("/joined",getAllUserJoinedLearnerRequests);
app.post("/join/:id",joinLearner);
app.route("/:id").put(editLearnerRequest).delete(deleteLearnerRequest).get(getLearnerRequest);

export default app;