import { REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import {TryCatch} from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Learner } from "../models/learner.js";
import {Project} from "../models/project.js";
import { User } from "../models/user.js";
import { emitEvent, sendLearnerJoinedMail, sendLearnerRequestFullMail, sendRequestOutMail } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";

const getAllLearners = TryCatch(
    async (req, res, next) => {
      const { search, sort, isProject} = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(process.env.REQUEST_PER_PAGE) || 10;
      const skip = (page - 1) * limit;
  
      const baseQuery= {};
  
      if (search) {
        baseQuery.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
      
      if (isProject !== undefined) baseQuery.isProject = isProject;
  
      const learnersPromise = Learner.find(baseQuery)
        .sort(sort && { teamSize: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);
  
      const [learnersFetched, filteredOnlyLearners] = await Promise.all([
        learnersPromise.populate("creator", "name avatar"),
        Learner.find(baseQuery).populate("creator", "name avatar"),
      ]);
  
      const totalPage = Math.ceil(filteredOnlyLearners.length / limit);
  
      return res.status(200).json({
        success: true,
        learners: learnersFetched,
        totalPage,
      });
    }
  );
  
const newLearnerRequest = TryCatch(async (req, res, next) => {
    const { title,isProject,teamSize, description,contactNumber } = req.body;

   if(!title || !description){
        return next(new ErrorHandler("Title and Description are required",400));
   }
    
    if(teamSize<=0){
        return next(new ErrorHandler("Total Seats should be greater than 0",400));
    }
    const learnerData = {
        description,
        creator:req.user,
        title,
        teamSize,
        isProject,
    };
    if (contactNumber) {
        rideData.contactNumber = contactNumber;
    }
    const learnerRequest = await Learner.create(learnerData);

    res.status(200).json({
        success: true,
        message: `Learner Request Created Successfully ${isProject?`and Project Created When other user joined it automitically create one Project Group`:``}`,
        learner:learnerRequest,
    });
});

const editLearnerRequest=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const learner=await Learner.findById(id);
    if(!learner){
          return next(new ErrorHandler("Learner Request not found",404));
    } 
    if(learner.creator.toString()!==req.user.toString()){
          return next(new ErrorHandler("You are not authorized to update this request",401));
    }
    const { title,isProject,teamSize, description,contactNumber } = req.body;
    if(learner.isProject){
        const project=await Project.findOne({learnerId:id});
        if(project){
            if(title)
            project.name=title;
           if(teamSize)
            project.teamSize=teamSize;
            await project.save();
        }
    }
    if(title)
    learner.title=title;
    if(description)
    learner.description=description;
    if(teamSize)
    learner.teamSize=teamSize;
    if(isProject===false){
        return next(new ErrorHandler("You can't remove it from project",400));
    }
    if(isProject){
    learner.isProject=isProject;
    if(learner.members.length>=1){
    const allMembers=[learner.creator,...learner.members];
    const chat=await Chat.create({
            members:allMembers,
            creator: req.user,
            groupChat: true,
            name: learner.title + " Group",
            isProject:true,
    });
    const project=await Project.create({
        name:title,
        creator:req.user,
        type:"group",
        members:learner.members,
        groupChat:chat._id,
        learnerId:id,
        teamSize,
    })
    const memberIncludingCreator = [...learner.members, project.creator];
        const user=await User.findById(req.user);
        emitEvent(req, REFETCH_CHATS, memberIncludingCreator,{
            message:`This is the project group created by ${user.name}`,
            chatId:chat._id,
        });
    }
    else{
        learner.isProject=false;
        return next(new ErrorHandler("Sorry,You can't create project without any member",400));
    } 
  }
    if(contactNumber)
    learner.contactNumber=contactNumber;
     
      await learner.save();
      res.status(200).json({
          success:true,
          message:`Learner Request Updated Successfully ${isProject?`and Project will created When Member Joined Become 2`:``}`,
      }) 
  })
  const deleteLearnerRequest=TryCatch(async(req,res,next)=>{
      const {id}=req.params;
      const learner=await Learner.findById(id);
      if(!learner){
          return next(new ErrorHandler("Learner Request not found",404));
      }
      if(learner.creator.toString()!==req.user.toString()){
          return next(new ErrorHandler("You are not authorized to delete this request",401));
      }
      if(learner.isProject){
        const project=await Project.findOne({learnerId:id});
        if(project){
            project.learnerId=null;
        }
      }
      await Learner.findByIdAndDelete(id);
      res.status(200).json({
          success:true,
          message:"Learner Request Deleted Successfully",
      })
  })
  const getLearnerRequest=TryCatch(async(req,res,next)=>{
      const id=req.params.id;
      const learner=await Learner.findById(id).populate("creator","name avatar").populate("members","name avatar");
      if(!learner){
          return next(new ErrorHandler("Learner Request not found",404));
      }
      const groupChat=null;
      if(learner.isProject){
        const project=await Project.findOne({learnerId:id});
        if(!project){
            return next(new ErrorHandler("Project not found",404));
        }
        groupChat=project.groupChat;
      }
      res.status(200).json({
          success:true,
          learner,
            groupChat,
      })
  });
  const getAllUserLearnerRequests=TryCatch(async(req,res,next)=>{
      const learner=await Learner.find({creator:req.user});
      res.status(200).json({
          success:true,
          learners:learner
      })
  });
  const joinLearner=TryCatch(async(req,res,next)=>{
      const {id}=req.params;
      const userId=req.user;
      const learner=await Learner.findById(id);
      if(!learner){
          return next(new ErrorHandler("Learner Request not found",404));
      }
      if(learner.members.includes(userId)){
        return next(new ErrorHandler("You have already joined this request",400));
    }
      if(learner.members.length>=learner.teamSize){
          return next(new ErrorHandler("Sorry,the team is full now ",400));
      }
      if(learner.teamSize<=0){
          return next(new ErrorHandler("No seats available",400));
      }
      if(learner.creator.toString()===req.user.toString()){
          return next(new ErrorHandler("You can't join your own request",400));
      }
      learner.members.push(userId);
      await learner.save();
      if(learner.members.length==1 && learner.isProject){
        const allMembers=[learner.creator,...learner.members];
        const chat=await Chat.create({
            members:allMembers,
            creator: req.user,
            groupChat: true,
            name: learner.title + " Group",
            isProject:true,
        });
        const project=await Project.create({
            name:learner.title,
            creator:learner.creator,
            type:"group",
            members:learner.members,
            groupChat:chat._id,
            teamSize:learner.teamSize,
            learnerId:id,
        })
        const memberIncludingCreator = [...learner.members, project.creator];
        const user=await User.findById(req.user);
        emitEvent(req, REFETCH_CHATS, memberIncludingCreator,{
            message:`This is the project group created by ${user.name}`,
            chatId:chat._id,
        });
      }
      else if(learner.members.length>1 && learner.isProject){
        const project=await Project.findOne({learnerId:id});
        if(!project){
            return next(new ErrorHandler("Project not found",404));
        }
        if(project.members.includes(userId)){
            return next(new ErrorHandler("You have already joined this project",400));
        }
        if(project.members.length>=project.teamSize){
            return next(new ErrorHandler("Sorry,the team is full now ",400));
        }
        const chat=await Chat.findById(project.groupChat);
        if(!chat){
            return next(new ErrorHandler("Chat not found",404));
        }
        chat.members.push(userId);
        await chat.save();
        project.members.push(userId);
        await project.save();
        const j=await User.findById(userId);
        emitEvent(req, REFETCH_CHATS,[learner.creator,learner.members],{
            message:`${j.name} has joined the project group`,
            chatId:chat._id,
        });
      }
      const existingChat=await Chat.findOne({members:[learner.creator,userId],groupChat:false});
      if(!existingChat){
      const newChat=await Chat.create({
          name:learner.title+" Chat",
          creator:learner.creator,
          members:[learner.creator,userId]
      });
      emitEvent(req, REFETCH_CHATS,learner.members);
    }
      const user=await User.findById(learner.creator);
      if(learner.members.length===learner.teamSize){
          sendLearnerRequestFullMail(user.email,learner.title,learner.teamSize,user.name);
      }
      else{
          const joiner=await User.findById(userId);
          sendLearnerJoinedMail(user.email,user.name,joiner.name,learner.title);
      }
      return res.status(200).json({
          success:true,
          message:"Learning Group joined Successfully,You can now chat with the creator",
      });
  });
  
  const getAllUserJoinedLearnerRequests=TryCatch(async(req,res,next)=>{
      const userId=req.user;
      const learners=await Learner.find({members:userId});
      res.status(200).json({
          success:true,
          learners
      })
  });
  const linkReqToExistingProject=TryCatch(async(req,res,next)=>{
    const {projectId}=req.body;
    console.log(projectId);
    const {id}=req.params;
    const project=await Project.findById(projectId);
    if(!project){
        return next(new ErrorHandler("Project not found",404));
    }
    if(project.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to link this project",401));
    }
    const learner=await Learner.findById(id);
    if(!learner){
        return next(new ErrorHandler("Learner Request not found",404));
    }
    if(project.learnerId){
        return next(new ErrorHandler("Project already linked to a learner request",400));
    }
    if(learner.isProject){
        return next(new ErrorHandler("Learner Request is already a project",400));
    }
    if(project.members.length>learner.teamSize){
        return next(new ErrorHandler("Project members are more than learner team size",400));
    }
    if(project.creator.toString()!==learner.creator.toString()){
        return next(new ErrorHandler("Project creator and learner creator should be same",400));
    }
    if(project.type!=="group"){
        return next(new ErrorHandler("Project should be a group project",400));
    }
    const extraMembers=project.members.filter(member=>!learner.members.includes(member));
    if(learner.members.length+extraMembers.length>learner.teamSize){
        return next(new ErrorHandler("Increase team size to link to this project",400));
    }
    const extraMembersFromLearner=learner.members.filter(member=>!project.members.includes(member));
    project.learnerId=id;
    project.members.push(...extraMembersFromLearner);
    project.teamSize=learner.teamSize;
    const chat=await Chat.findById(project.groupChat);
    if(!chat){
        return next(new ErrorHandler("Chat not found",404));
    }
    chat.members.push(...extraMembersFromLearner);
    await chat.save();
    await project.save();
    learner.isProject=true;
    learner.members.push(...extraMembers);
    await learner.save();
    res.status(200).json({
        success:true,
        message:"Project linked to learner request successfully",
    })
  });
  const addMemberToLearner=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const learner=await Learner.findById(id);
    if(!learner){
        return next(new ErrorHandler("Learner Request not found",404));
    }
    if(learner.isProject){
        return next(new ErrorHandler("You can add members in request instead add in project",400));
    }
    if(learner.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to add member to this request",401));
    }
    const {members}=req.body;
    if(!members){
        return next(new ErrorHandler("Members are required",400));
    }
    if(learner.members.length+members.length>learner.teamSize){
        return next(new ErrorHandler("Members are more than team size",400));
    }
    const existingMembers=learner.members;
    const allMembers=[...existingMembers,...members];
    learner.members=allMembers;
    await learner.save();
    res.status(200).json({
        success:true,
        message:"Members added successfully",
    })
  });
  const removeMemberFromLearner=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const learner=await Learner.findById(id);
    if(!learner){
        return next(new ErrorHandler("Learner Request not found",404));
    }
    if(learner.isProject){
        return next(new ErrorHandler("You can remove members in request instead remove in project",400));
    }
    if(learner.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to remove member from this request",401));
    }
    const {member}=req.body;
    if(!member){
        return next(new ErrorHandler("Member is required",400));
    }
    const user=await User.findById(member);
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }
    if(!learner.members.includes(member)){
        return next(new ErrorHandler("Member not found in request",400));
    }
    const existingMembers=learner.members;
    const allMembers=existingMembers.filter(m=>m.toString()!==member.toString());
    learner.members=allMembers;
    await learner.save();
    const creator=await User.findById(learner.creator);
    sendRequestOutMail(user.email,"Learner",user.name,creator.name,learner.title);
    res.status(200).json({
        success:true,
        message:"Member removed successfully",
    })
  });
  const freindsOtherThanLearnerMembers = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const learner = await Learner.findById(id);
  
    if (!learner) {
      return next(new ErrorHandler("Learner Request not found", 404));
    }
  
    const chats = await Chat.find({
      members: req.user,
      groupChat: false,
    }).populate("members", "name avatar");
  
    const friendsSet = new Map();
  
    chats.forEach(({ members }) => {
      const otherUser = getOtherMember(members, req.user);
  
      if (!friendsSet.has(otherUser._id.toString())) {
        friendsSet.set(otherUser._id.toString(), {
          _id: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar?.url || "", // Handle missing avatar safely
        });
      }
    });
  
    const friends = Array.from(friendsSet.values());
  
    const currentMembers = learner.members.map((member) => member.toString());
    const availableFriends = friends.filter(friend => !currentMembers.includes(friend._id.toString()));
  
    return res.status(200).json({
      success: true,
      friends: availableFriends,
    });
  });
  
  const leaveLearner=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const learner=await Learner.findById(id);
    if(!learner){
        return next(new ErrorHandler("Project not found",404));
    }
    if(learner.creator.toString()===req.user.toString()){
        return next(new ErrorHandler("Make someone else admin of this project from chat to leave project",400));
    }
    if(learner.members.length<=1){
        return next(new ErrorHandler("You can delete this project instead of leaving it",400));
    }
    const user=await User.findById(req.user);
    const creator=await User.findById(learner.creator);
    learner.members=learner.members.filter(member=>member.toString()!==req.user.toString());
    sendUserLeftMailToCreator(creator.email,"Learner",user.name,creator.name,learner.title);
    if(learner.isProject){
        const project=await Project.findOne({learnerId:id});
        if(!project){
            return next(new ErrorHandler("Project not found",404));
        }
        if(project.creator.toString()===req.user.toString()){
            return next(new ErrorHandler("Make someone else admin of this project from chat to leave project",400));
        }
        if(project.members.length<=1){
            return next(new ErrorHandler("You can delete this project instead of leaving it",400));
        }
        project.members=project.members.filter(member=>member.toString()!==req.user.toString());
        const chat=await Chat.findById(project.groupChat);
        if(!chat){
            return next(new ErrorHandler("Chat not found",404));
        }
        chat.members=chat.members.filter(member=>member.toString()!==req.user.toString());
        emitEvent(req, REFETCH_CHATS, project.members,{
            message:`${user.name} has left the project group`,
            chatId:chat._id,
        });
        await chat.save();
        await project.save();
    }
    await learner.save();
    res.status(200).json({
        success:true,
        message:"You left learner request successfully",
    })
  });
export {
newLearnerRequest,
editLearnerRequest,
deleteLearnerRequest,
getLearnerRequest,
getAllUserLearnerRequests,
getAllUserJoinedLearnerRequests,
joinLearner,
getAllLearners,
linkReqToExistingProject,
addMemberToLearner,
removeMemberFromLearner,
freindsOtherThanLearnerMembers,
leaveLearner,
}
