import {TryCatch} from "../middlewares/error.js";
import { Goal } from "../models/goal.js";
import { Project } from "../models/project.js";
import { ErrorHandler } from "../utils/utility.js";

const createGoal = TryCatch(async (req, res, next) => {
    const { projectId, title, description, assignedTo } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }
    if (!title || !description) {
        return next(new ErrorHandler("Title and description are required", 400));
    }
    if (project.creator.toString() !== req.user.toString()) {
        return next(new ErrorHandler("You are not authorized to create a goal for this project", 403));
    }

    // Ensure assignedTo is an array if provided, else default to an empty array
    let assignedUsers = Array.isArray(assignedTo) ? assignedTo : [];

    // If assignedTo is empty, assign the goal to the current user
    if (assignedUsers.length === 0) {
        assignedUsers.push(req.user);
    }

    const goal = await Goal.create({
        project: projectId,
        title,
        description,
        assignedTo: assignedUsers,
    });
    project.goals.push(goal._id);
    await project.save();
    res.status(201).json({
        success: true,
        message: "Goal created successfully",
    });
});
const deleteGoal=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const goal=await Goal.findById(id);
    if(!goal){
        return next(new ErrorHandler("Goal not found",404));
    }
    const project=await Project.findById(goal.project);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    if(project.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to delete goal for this project",403));
    }
    project.goals=project.goals.filter((g)=>g.toString()!==goal._id.toString());
    await project.save();
    await Goal.findByIdAndDelete(goal._id);
    res.status(200).json({
        success:true,
        message:"Goal deleted successfully",
    });
});
const updateGoal = TryCatch(async (req, res, next) => {
    const { id} = req.params;
    const { title, description, assignedTo, completed } = req.body;

    const goal = await Goal.findById(id);
    if (!goal) {
        return next(new ErrorHandler("Goal not found", 404));
    }
    if (goal.completed) {
        return next(new ErrorHandler("Completed goals cannot be updated", 400));
    }

    const project = await Project.findById(goal.project);
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }
    if (project.creator.toString() !== req.user.toString()) {
        return next(new ErrorHandler("You are not authorized to update this goal", 403));
    }

    // Ensure assignedTo is an array if provided, else default to current assigned users
    let updatedAssignedTo = Array.isArray(assignedTo) ? assignedTo : goal.assignedTo;

    // If assignedTo is empty, assign the goal to the creator
    if (updatedAssignedTo.length === 0) {
        updatedAssignedTo = [req.user];
    }

    goal.title = title || goal.title;
    goal.description = description || goal.description;
    goal.assignedTo = updatedAssignedTo;
    goal.completed = completed !== undefined ? completed : goal.completed;

    await goal.save();

    res.status(200).json({
        success: true,
        message: "Goal updated successfully",
    });
});

const getProjectGoals=TryCatch(async(req,res,next)=>{
    const {projectId}=req.body;
    const project=await Project.findById(projectId);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    const goals=await Goal.find({project:projectId}).populate("assignedTo","name avatar");
    res.status(200).json({
        success:true,
        goals,
    });
});
const markGoalAsCompleted=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const goal=await Goal.findById(id);
    if(!goal){
        return next(new ErrorHandler("Goal not found",404));
    }
    const project=await Project.findById(goal.project);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    if(goal.completed){
        return next(new ErrorHandler("Goal is already completed",400));
    }
    for(let i=0;i<goal.assignedTo.length;i++){
        if(goal.assignedTo[i].toString()===req.user.toString()){
            goal.completed=true;
            await goal.save();
        }
    }
    if(goal.completed===false){
        return next(new ErrorHandler("You are not assigned to this goal",403));
    }
    return res.status(200).json({
        success:true,
        message:"Goal  completed successfully",
    });
});
const getUserAssignedGoals=TryCatch(async(req,res,next)=>{
    const {projectId}=req.body;
    const project=await Project.findById(projectId);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    const goals=await Goal.find({project:projectId,assignedTo:req.user});
    res.status(200).json({
        success:true,
        goals,
    });
});
const getGoal=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const goal=await Goal.findById(id).populate("assignedTo");
    if(!goal){
        return next(new ErrorHandler("Goal not found",404));
    }
    res.status(200).json({
        success:true,
        goal,
    });
});
const getProjectCompletedGoals=TryCatch(async(req,res,next)=>{
const {projectId}=req.body;
const project=await Project.findById(projectId);
if(!project){
    return next(new ErrorHandler("Project not found",404));
}
const goals=await Goal.find({project:projectId,completed:true}).populate("assignedTo","name avatar");
res.status(200).json({
    success:true,
    goals,
});
});
const getProjectPendingGoals=TryCatch(async(req,res,next)=>{
    const {projectId}=req.body;
    const project=await Project.findById(projectId);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    const goals=await Goal.find({project:projectId,completed:false}).populate("assignedTo");
    res.status(200).json({
        success:true,
        goals,
    });
});

export {createGoal,deleteGoal,updateGoal,getProjectGoals,markGoalAsCompleted,getUserAssignedGoals,getGoal,getProjectCompletedGoals,getProjectPendingGoals};