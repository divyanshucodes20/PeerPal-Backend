import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {createGoal,deleteGoal,updateGoal,markGoalAsCompleted,getProjectGoals,getUserAssignedGoals, getGoal, getProjectCompletedGoals, getProjectPendingGoals} from "../controllers/goals.js";

const app = express.Router();

app.use(isAuthenticated);
app.post("/new",createGoal);
app.get("/my/:id",getUserAssignedGoals);
app.get("/all/:id",getProjectGoals);
app.get("/completed/:id",getProjectCompletedGoals);
app.get("/pending/:id",getProjectPendingGoals);
app.put("/done/:id",markGoalAsCompleted);
app.route("/:id").get(getGoal).put(updateGoal).delete(deleteGoal);

export default app;