import { REFETCH_CHATS } from "../constants/events.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Roommate } from "../models/roommate.js";
import { User } from "../models/user.js";
import { emitEvent, sendRoommateJoinedMail } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";


const getAllRoommates = TryCatch(
    async (req, res, next) => {
      const { search, sort,location,rent} = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(process.env.REQUEST_PER_PAGE) || 10;
      const skip = (page - 1) * limit;
  
      const baseQuery= {};
  
      if (search)
        baseQuery.description = {
          $regex: search,
          $options: "i",
        };
        if (location){
            baseQuery.location=location
        }
        if(rent){
            baseQuery.rent={
                $lte:rent
            }
        }

      const roommatesPromise =Roommate.find(baseQuery)
        .sort(sort && { teamSize: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);
  
      const [roommatesFetched, filteredOnlyRoommates] = await Promise.all([
        roommatesPromise.populate("creator", "name avatar"),
        Roommate.find(baseQuery).populate("creator", "name avatar"),
      ]);
  
      const totalPage = Math.ceil(filteredOnlyRoommates.length / limit);
  
      return res.status(200).json({
        success: true,
        roommates: roommatesFetched,
        totalPage,
      });
    }
  );
  
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
    roommate.description=description;
    if(contactNumber)
    roommate.contactNumber=contactNumber
   
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
    await Roommate.findByIdAndDelete(id);
    res.status(200).json({
        success:true,
        message:"Roommate Request Deleted Successfully",
    })
})
const getRoommateRequest=TryCatch(async(req,res,next)=>{
    const id=req.params.id;
    const roommate=await Roommate.findById(id).populate("creator","name avatar");
    if(!roommate){
        return next(new ErrorHandler("Roommate Request not found",404));
    }
    res.status(200).json({
        success:true,
        roommate
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
    if(roommate.creator.toString()===userId.toString()){
        return next(new ErrorHandler("You are the creator of this Roommate Request",403));
    }
    const user=await User.findById(roommate.creator);
    const existingChat=await Chat.findOne({members:[roommate.creator,userId]});
    if(existingChat){
        return next(new ErrorHandler(`You are already connected to ${user.name} you can directly connect him through chat`,403));
    }
    const chat=await Chat.create({
        name:roommate.location+" Roommate Request",
        creator:roommate.creator,
        members:[roommate.creator,userId]
    });
    emitEvent(req,REFETCH_CHATS,[roommate.creator,userId]);
    const joiner=await User.findById(userId);
    sendRoommateJoinedMail(user.email,user.name,joiner.name);
    res.status(200).json({
        success:true,
        message:"Successfully Joined Roommate Request You can now chat with the creator",
    })
});
const getAllLocation=TryCatch(async(req,res,next)=>{
    const locations=await Roommate.find().distinct("location");
    res.status(200).json({
        success:true,
        locations
    })
});
export {
    newRoommateRequest,
    editRoommateRequest,
    deleteRoommateRequest,
    getRoommateRequest,
    getAllUserRoommateRequests,
    joinRoommateRequest,
    getAllRoommates,getAllLocation
}
