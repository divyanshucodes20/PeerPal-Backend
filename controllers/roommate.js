import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Roommate } from "../models/roommate.js";
import { ErrorHandler } from "../utils/utility.js";


const newRoommateRequest = TryCatch(async (req, res, next) => {
    const { location,description,contactNumber,rent } = req.body;
     const creator=req.user;
    if(!location || !description || !creator){
        return next(new ErrorHandler("All Fields are Required",400));
    }

    const roommateData = {
        location,
        description,
        creator,
    };
    if (contactNumber) {
        roommateData.contactNumber = contactNumber;
    }
    if (rent) {
        roommateData.rent = rent;
    }
    const roommateRequest = await Roommate.create(roommateData);

    res.status(200).json({
        success: true,
        message: "Roommate Request Created Successfully",
    });
});


const editRoommateRequest=TryCatch(async(req,res,next)=>{
  const {id}=req.params;
  const roommate=await Roommate.findById(id);
  if(!roommate){
        return next(new ErrorHandler("Roommate Request not found",404));
  } 
  if(roommate.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to update this Roommate Request",403));
  }
    const {location,description,rent,contactNumber}=req.body;
    if(location)
    roommate.location=location;
    if(rent)
    roommate.rent=rent;
    if(description)
    ride.description=description;
    if(contactNumber)
    ride.contactNumber=contactNumber
   
    await roommate.save();
    res.status(200).json({
        success:true,
        message:"Roommate Request Updated Successfully",
    }) 
})
const deleteRoommateRequest=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const roommate=await Roommate.findById(id);
    if(!roommate){
        return next(new ErrorHandler("Roommate Request not found",404));
    }
    if(roommate.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to delete this Roommate Request",403));
    }
    await roommate.remove();
    res.status(200).json({
        success:true,
        message:"Roommate Request Deleted Successfully",
    })
})
const getRoommateRequest=TryCatch(async(req,res,next)=>{
    const id=req.params.id;
    const roommate=await Roommate.findById(id);
    if(!roommate){
        return next(new ErrorHandler("Roommate Request not found",404));
    }
    res.status(200).json({
        success:true,
        data:roommate
    })
});
const getAllUserRoommateRequests=TryCatch(async(req,res,next)=>{
    const roommates=await Roommate.find({creator:req.user});
    res.status(200).json({
        success:true,
        data:roommates
    })
});
const joinRoommateRequest=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const userId=req.user;
    const roommate=await Roommate.findById(id);
    if(!roommate){
        return next(new ErrorHandler("Roommate Request not found",404));
    }
    const chat=await Chat.create({
        name:roommate.location+" Roommate Request",
        creator:roommate.creator,
        members:[roommate.creator,userId]
    })
    res.status(200).json({
        success:true,
        message:"Successfully Joined Roommate Request You can now chat with the creator",
    })
});
export {
    newRoommateRequest,
    editRoommateRequest,
    deleteRoommateRequest,
    getRoommateRequest,
    getAllUserRoommateRequests,
    joinRoommateRequest
}
