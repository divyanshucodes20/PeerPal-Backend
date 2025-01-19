import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {createGoal,deleteGoal,updateGoal,markGoalAsCompleted,getProjectGoals,getUserAssignedGoals} from "../controllers/goals.js";

const app = express.Router();

app.use(isAuthenticated);
app.post("/new",createGoal);
app.get("/my",getUserAssignedGoals);
app.get("/all",getProjectGoals);
app.put("/done/:id",markGoalAsCompleted);
app.route("/:id").put(updateGoal).delete(deleteGoal);

export default app;