import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {newProject,editProject,deleteProject,getAllUserJoinedProjects,getAllUserProjects,getProjectDetails,addMembersToProject,removeMemberFromProject, getProjectSuggestions, getAllFreindsOtherThanProjectMembers} from "../controllers/project.js";

const app = express.Router();

app.use(isAuthenticated);
app.post("/new",newProject);
app.get("/my",getAllUserProjects);
app.get("/suggestions/:id",getProjectSuggestions)
app.get("/joined",getAllUserJoinedProjects);
app.put("/add/:id",addMembersToProject);
app.put("/remove/:id",removeMemberFromProject);
app.get("/other-members/:id",getAllFreindsOtherThanProjectMembers);
app.route("/:id").put(editProject).delete(deleteProject).get(getProjectDetails);

export default app;