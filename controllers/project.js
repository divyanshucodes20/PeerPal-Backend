import { REFETCH_CHATS } from "../constants/events.js";
import {TryCatch} from "../middlewares/error.js"
import { Chat } from "../models/chat.js";
import { Goal } from "../models/goal.js";
import { Learner } from "../models/learner.js";
import { Project } from "../models/project.js";
import { User } from "../models/user.js";
import { emitEvent, generateProjectSuggestions, sendRequestDeletionEmailToMembers } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";


const newProject=TryCatch(
    async (req, res,next) => {
      const {name,type,teamSize}=req.body;
      if(!name){
        return next(new ErrorHandler("Please provide project name",400));
      }
      if (type === "group") {
        if(!teamSize || teamSize<=0){
            return next(new ErrorHandler("Total Team Size should be greater than 0",400));
        }
        const { members } = req.body;
        if (!members || members.length < 1) {
          return next(new ErrorHandler("Please provide members or create learning request as project to find members", 400));
        }
    
        for (const member of members) {
          const user = await User.findById(member);
          if (!user) {
            return next(new ErrorHandler("User not found", 404));
          }
        }
        const allMembers = [...members, req.user];
        // Create the group chat
        const chat = await Chat.create({
          members: allMembers,
          creator: req.user,
          groupChat: true,
          name: name + " Group",
          isProject:true,
        });
        const project = await Project.create({ name, type, creator: req.user, members,groupChat:chat._id,
          teamSize
        });
        // Emit event with the created chat ID
        const memberIncludingCreator = [...members, project.creator];
        const user=await User.findById(req.user);
        emitEvent(req, REFETCH_CHATS, memberIncludingCreator,{
            message:`This is the project group created by ${user.name}`,
            chatId:chat._id,
        });    
        return res.status(201).json({success:true,message:"Project created successfully and members added to group chat"});
      }
      else{
        const project=await Project.create({name,creator:req.user});
        return res.status(201).json({success:true,message:"Project created successfully"});
      }
    }
);
const editProject=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const project=await Project.findById(id);
    if(!project){
          return next(new ErrorHandler("Project not found",404));
    } 
    if(project.creator.toString()!==req.user.toString()){
          return next(new ErrorHandler("You are not authorized to update this project",401));
    }
    const {name,type,teamSize}=req.body;
    if(name){
        project.name=name;
    }
    if(project.type==="group" && teamSize){
      if(project.members.length>teamSize){
        return next(new ErrorHandler("Team size can't be less than current members",400));
      }
      if(teamSize<=0){
        return next(new ErrorHandler("Total team size should be greater than 0",400));
      }
        project.teamSize=teamSize;
    }
    if(type==="group"){
        if(teamSize<=0){
          return next(new ErrorHandler("Total team size should be greater than 0",400));
        }
        if(project.type==="group"){
          return next(new ErrorHandler("Project is already group type",400));
        }
        const {members}=req.body;
        if(!members || members.length<1){
          return next(new ErrorHandler("Please provide members or create learning request as project to find members",400));
        }
        for (const member of members) {
            const user = await User.findById(member);
            if (!user) {
              return next(new ErrorHandler("User not found", 404));
            }
          }
          project.members=members;
          const chat = await Chat.create({
            members,
            creator: req.user,
            groupChat: true,
            name: name + " Group",
            isProject:true,
          });
            project.groupChat=chat._id;
            const memberIncludingCreator = [...members, project.creator];
            const user=await User.findById(req.user);
            emitEvent(req, REFETCH_CHATS, memberIncludingCreator,{
                message:`This is the project group created by ${user.name}`,
                chatId:chat._id,
            });   
    }
    else if(type==="personal"){
      return next(new ErrorHandler("You can't change project type to personal",400));
    }
    await project.save();
      res.status(200).json({
          success:true,
          message:"Project Updated Successfully",
      }) 
  })
  const deleteProject=TryCatch(async(req,res,next)=>{
      const {id}=req.params;
      const project=await Project.findById(id);
      if(!project){
          return next(new ErrorHandler("Project not found",404));
      }
      if(project.creator.toString()!==req.user.toString()){
          return next(new ErrorHandler("You are not authorized to delete this project",401));
      }
      if(project.type==="group"){
        const members=project.members;
            if(members.length>0){
                const user=await User.findById(project.creator);
                members.forEach(async(member)=>{
                    const otherUser=await User.findById(member);
                    sendRequestDeletionEmailToMembers(otherUser.email,"Project",otherUser.name,user.name,project.name);
                })
            }
      }
      const chat = await Chat.findByIdAndDelete(project.groupChat);
      if(project.learnerId){
      const learnerRequest=await Learner.findByIdAndDelete(project.learnerId);
      }
      await Project.findByIdAndDelete(id);
      res.status(200).json({
          success:true,
          message:"Project and its Group Deleted Successfully",
      })
  })
  const getProjectDetails=TryCatch(async(req,res,next)=>{
      const id=req.params.id;
      const project=await Project.findById(id).populate("creator","name avatar").populate("members","name avatar");
      if(!project){
          return next(new ErrorHandler("Project not found",404));
      }
      res.status(200).json({
          success:true,
          data:project
      })
  });
  const getAllUserProjects=TryCatch(async(req,res,next)=>{
      const projects=await Project.find({creator:req.user});
      res.status(200).json({
          success:true,
          data:projects
      })
  });
  
  const getAllUserJoinedProjects=TryCatch(async(req,res,next)=>{
      const userId=req.user;
      const projects=await Project.find({members:userId}).populate("creator","name avatar").populate("members","name avatar");
      res.status(200).json({
          success:true,
          data:projects
      })
  });
  const addMembersToProject=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const project=await Project.findById(id);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    if(project.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to add members to this project",401));
    }
    if(project.type!=="group"){
        return next(new ErrorHandler("You can't add members to self project",400));
    }
    if(project.members.length>=project.teamSize){
        return next(new ErrorHandler("Team is full you can edit project to increase team size",400));
    }
    const {members}=req.body;
    if(!members || members.length<1){
        return next(new ErrorHandler("Please provide members to add",400));
    }
    for (const member of members) {
        const user = await User.findById(member);
        if (!user) {
          return next(new ErrorHandler("User not found", 404));
        }
      }
      project.members.push(...members);
      await project.save();
        const chat = await Chat.findById(project.groupChat);
        chat.members.push(...members);
      const user=await User.findById(req.user);
      emitEvent(req, REFETCH_CHATS, chat.members,{
            message:`Members added to project group by ${user.name}`,
            chatId:chat._id,
      });    
      res.status(200).json({
          success:true,
          message:"Members added to project as well as group successfully",
      })
  });
  const removeMemberFromProject=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const project=await Project.findById(id);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    if(project.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to remove members from this project",401));
    }
    if(project.type!=="group"){
        return next(new ErrorHandler("You can't remove members from self project",400));
    }
    if(project.members.length<=1){
        return next(new ErrorHandler("You can't remove all members from project",400));
    }
    const {member}=req.body;
    if(!member){
        return next(new ErrorHandler("Please provide member to remove",400));
    }
    project.members=project.members.filter((m)=>m.toString()!==member.toString());
    await project.save();
    const chat = await Chat.findById(project.groupChat);
    chat.members=chat.members.filter((m)=>m.toString()!==member.toString());
    emitEvent(req, REFETCH_CHATS, chat.members,{
        message:`Member removed from project group by project creator`,
        chatId:chat._id,
    });
  });
const getProjectSuggestions = TryCatch(async (req, res, next) => {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required." });
    }
  
    const project = await Project.findById(projectId).populate("members").populate("goals");
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }
  
    const goals = await Goal.find({ project: projectId });
    const suggestions = await generateProjectSuggestions(project, goals);
  
    return res.status(200).json({
      success: true,
      suggestions,
    });
  });
  
export {
    newProject,
    editProject,
    deleteProject,
    getProjectDetails,
    getAllUserProjects,
    getAllUserJoinedProjects,
    addMembersToProject,
    removeMemberFromProject,
    getProjectSuggestions
}