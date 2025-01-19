import {TryCatch} from "../middlewares/error.js";
import { Goal } from "../models/goal.js";
import { Project } from "../models/project.js";
import { ErrorHandler } from "../utils/utility.js";


const createGoal=TryCatch(async(req,res,next)=>{
    const {projectId,title,description,assignedTo}=req.body;
    const project=await Project.findById(projectId);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    if(!title || !description){
        return next(new ErrorHandler("Title and description are required",400));
    }
    if(project.creator.toString()!==req.user._id.toString()){
        return next(new ErrorHandler("You are not authorized to create goal for this project",403));
    }
    if(project.type==="group"){
    if(assignedTo.length===0){
        return next(new ErrorHandler("At least one user should be assigned to the goal",400));
    }
    }
    else{
        assignedTo.push(req.user);
    }
    const goal=await Goal.create({
        project:projectId,
        title,
        description,
        assignedTo,
    });
    res.status(201).json({
        success:true,
        message:"Goal created successfully",
    });
});
const deleteGoal=TryCatch(async(req,res,next)=>{
    const {goalId}=req.params;
    const goal=await Goal.findById(goalId);
    if(!goal){
        return next(new ErrorHandler("Goal not found",404));
    }
    const project=await Project.findById(goal.project);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    if(project.creator.toString()!==req.user._id.toString()){
        return next(new ErrorHandler("You are not authorized to delete goal for this project",403));
    }
    await goal.remove();
    res.status(200).json({
        success:true,
        message:"Goal deleted successfully",
    });
});
const updateGoal=TryCatch(async(req,res,next)=>{
    const {goalId}=req.params;
    const {title,description,assignedTo,completed}=req.body;
    const goal=await Goal.findById(goalId);
    if(!goal){
        return next(new ErrorHandler("Goal not found",404));
    }
    if(goal.completed){
        return next(new ErrorHandler("Completed goals cannot be updated",400));
    }
    const project=await Project.findById(goal.project);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    if(project.creator.toString()!==req.user._id.toString()){
        return next(new ErrorHandler("You are not authorized to update goal for this project",403));
    }
    if(project.type==="group"){
        if(assignedTo.length===0){
            return next(new ErrorHandler("At least one user should be assigned to the goal",400));
        }
    }
    goal.title=title;
    goal.description=description;
    goal.assignedTo=assignedTo;
    goal.completed=completed;
    await goal.save();
    res.status(200).json({
        success:true,
        message:"Goal updated successfully",
    });
});
const getProjectGoals=TryCatch(async(req,res,next)=>{
    const {projectId}=req.body;
    const project=await Project.findById(projectId);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    const goals=await Goal.find({project:projectId}).populate("assignedTo");
    res.status(200).json({
        success:true,
        goals,
    });
});
const markGoalAsCompleted=TryCatch(async(req,res,next)=>{
    const {goalId}=req.params;
    const goal=await Goal.findById(goalId);
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
        if(goal.assignedTo[i].toString()===req.user._id.toString()){
            goal.completed=true;
            await goal.save();
            return res.status(200).json({
                success:true,
                message:"Goal marked as completed successfully",
            });
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

export {createGoal,deleteGoal,updateGoal,getProjectGoals,markGoalAsCompleted,getUserAssignedGoals};