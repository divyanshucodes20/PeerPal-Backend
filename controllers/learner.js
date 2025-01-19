import {TryCatch} from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Learner } from "../models/learner.js";
import {Project} from "../models/project.js";
import { User } from "../models/user.js";
import { emitEvent, sendLearnerJoinedMail, sendLearnerRequestFullMail } from "../utils/features.js";


const newLearnerRequest = TryCatch(async (req, res, next) => {
    const { title,isProject,isPublic, teamSize, description,contactNumber } = req.body;

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
        isPublic
    };
    if (contactNumber) {
        rideData.contactNumber = contactNumber;
    }
    if(isProject){
    const project=await Project.create({
        name:title,
        creator:req.user,
        type:"group",
    })
    }
    const learnerRequest = await Learner.create(learnerData);

    res.status(200).json({
        success: true,
        message: "Learner Request Created Successfully ${isProject?`and Project Created`:``}",
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
    const { title,isProject,isPublic, teamSize, description,contactNumber } = req.body;
    if(title)
    learner.title=title;
    if(description)
    learner.description=description;
    if(teamSize)
    learner.teamSize=teamSize;
    if(isProject){
    learner.isProject=isProject;
    const chat=await Chat.create({
            members:learner.members,
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
    })
    const memberIncludingCreator = [...members, project.creator];
        const user=await User.findById(req.user);
        emitEvent(req, REFETCH_CHATS, memberIncludingCreator,{
            message:`This is the project group created by ${user.name}`,
            chatId:chat._id,
        }); 
  }
    if(isPublic)
    learner.isPublic=isPublic;
    if(contactNumber)
    learner.contactNumber=contactNumber;
     
      await learner.save();
      res.status(200).json({
          success:true,
          message:"Learner Request Updated Successfully",
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
      await learner.remove();
      res.status(200).json({
          success:true,
          message:"Learner Request Deleted Successfully",
      })
  })
  const getLearnerRequest=TryCatch(async(req,res,next)=>{
      const id=req.params.id;
      const learner=await Learner.findById(id);
      if(!learner){
          return next(new ErrorHandler("Learner Request not found",404));
      }
      res.status(200).json({
          success:true,
          data:learner
      })
  });
  const getAllUserLearnerRequests=TryCatch(async(req,res,next)=>{
      const learner=await Learner.find({creator:req.user});
      res.status(200).json({
          success:true,
          data:learner
      })
  });
  const joinLearner=TryCatch(async(req,res,next)=>{
      const {id}=req.params;
      const userId=req.user;
      const learner=await Learner.findById(id);
      if(!learner){
          return next(new ErrorHandler("Learner Request not found",404));
      }
      if(learner.members.length>=learner.teamSize){
          return next(new ErrorHandler("Sorry,the team is full now ",400));
      }
      if(learner.teamSize<=0){
          return next(new ErrorHandler("No seats available",400));
      }
      if(learner.members.includes(userId)){
          return next(new ErrorHandler("You have already joined this request",400));
      }
      if(learner.creator===userId){
          return next(new ErrorHandler("You can't join your own request",400));
      }
      learner.members.push(userId);
      await learner.save();
      const newChat=await Chat.create({
          name:learner.title+" Chat",
          creator:learner.creator,
          members:[learner.creator,userId]
      });
      emitEvent(req, REFETCH_CHATS,learner.members);
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
          data:ride
      });
  });
  
  const getAllUserJoinedLearnerRequests=TryCatch(async(req,res,next)=>{
      const userId=req.user;
      const learners=await Learner.find({members:userId});
      res.status(200).json({
          success:true,
          data:learners
      })
  });

export {
newLearnerRequest,
editLearnerRequest,
deleteLearnerRequest,
getLearnerRequest,
getAllUserLearnerRequests,
getAllUserJoinedLearnerRequests,
joinLearner
}
