import { REFETCH_CHATS } from "../constants/events.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Ride } from "../models/ride.js";
import { User } from "../models/user.js";
import { emitEvent, sendRequestDeletionEmailToMembers, sendRideFullMail, sendRideJoinedMail } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";


const newRideRequest = TryCatch(async (req, res, next) => {
    const { source, destination, prizePerPerson, seats, description, date, contactNumber } = req.body;

    if (!source || !destination || !prizePerPerson || !seats || !description || !date) {
        return next(new ErrorHandler("Please provide all the required details", 400));
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
    return next(new ErrorHandler("Invalid Date format. Use YYYY-MM-DD.", 400));
     }
    if(seats<=0){
        return next(new ErrorHandler("Total Seats should be greater than 0",400));
    }
    const rideData = {
        source,
        destination,
        prizePerPerson,
        seats,
        description,
        creator:req.user,
        date,
    };
    if (contactNumber) {
        rideData.contactNumber = contactNumber;
    }

    const rideRequest = await Ride.create(rideData);

    res.status(200).json({
        success: true,
        message: "Ride Request Created Successfully",
    });
});

const getAllRideRequests = TryCatch(
    async (req, res, next) => {
      const { search, sort, source, destination, prizePerPerson, date } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(process.env.REQUEST_PER_PAGE) || 10;
      const skip = (page - 1) * limit;
  
      const baseQuery= {};
  
      if (search)
        baseQuery.description = {
          $regex: search,
          $options: "i",
        };
  
      if (source) baseQuery.source = source;
      if (destination) baseQuery.destination = destination;
      if (prizePerPerson)
        baseQuery.prizePerPerson = {
          $lte: Number(prizePerPerson),
        };
      if (date)
        baseQuery.date = {
          $gte: new Date(date),
        };
  
      const rideRequestsPromise = Ride.find(baseQuery)
        .sort(sort && { prizePerPerson: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);
  
      const [rideRequestsFetched, filteredOnlyRideRequests] = await Promise.all([
        rideRequestsPromise,
        Ride.find(baseQuery),
      ]);
  
      const totalPage = Math.ceil(filteredOnlyRideRequests.length / limit);
  
      return res.status(200).json({
        success: true,
        rideRequests: rideRequestsFetched,
        totalPage,
      });
    }
);
  
  

const editRideRequest=TryCatch(async(req,res,next)=>{
  const {id}=req.params;
  const ride=await Ride.findById(id);
  if(!ride){
        return next(new ErrorHandler("Ride Request not found",404));
  } 
  if(ride.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to update this ride",401));
  }
    const {source,destination,prizePerPerson,seats,description,date,contactNumber}=req.body;
    if(source)
    ride.source=source;
    if(destination)
    ride.destination=destination;
    if(prizePerPerson)
    ride.prizePerPerson=prizePerPerson;
    if(seats)
    ride.seats=seats;
    if(description)
    ride.description=description;
    if(date)
    ride.date=date;
    if(contactNumber)
    ride.contactNumber=contactNumber
   
    await ride.save();
    res.status(200).json({
        success:true,
        message:"Ride Request Updated Successfully",
    }) 
})
const deleteRideRequest=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const ride=await Ride.findById(id);
    if(!ride){
        return next(new ErrorHandler("Ride Request not found",404));
    }
    if(ride.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorized to delete this ride",401));
    }
    const members=ride.members;
    if(members.length>0){
        const user=await User.findById(ride.creator);
        members.forEach(async(member)=>{
            const otherUser=await User.findById(member);
            sendRequestDeletionEmailToMembers(otherUser.email,"Ride",otherUser.name,user.name,ride.source+ "to" +ride.destination);
        })
    }
    await Ride.deleteOne({_id:id});
    res.status(200).json({
        success:true,
        message:"Ride Request Deleted Successfully",
    })
})
const getRideRequest=TryCatch(async(req,res,next)=>{
    const id=req.params.id;
    const ride=await Ride.findById(id).populate("creator","name avatar").populate("members","name avatar");
    if(!ride){
        return next(new ErrorHandler("Ride Request not found",404));
    }
    res.status(200).json({
        success:true,
        data:ride
    })
});
const getAllUserRides=TryCatch(async(req,res,next)=>{
    const rides=await Ride.find({creator:req.user});
    res.status(200).json({
        success:true,
        data:rides
    })
});
const joinRide=TryCatch(async(req,res,next)=>{
    const {id}=req.params;
    const userId=req.user;
    const ride=await Ride.findById(id);
    if(!ride){
        return next(new ErrorHandler("Ride Request not found",404));
    }
    if(ride.members.length>=ride.seats){
        return next(new ErrorHandler("No seats available",400));
    }
    if(ride.seats<=0){
        return next(new ErrorHandler("No seats available",400));
    }
    if(ride.members.includes(userId)){
        return next(new ErrorHandler("You have already joined this ride",400));
    }
    if(ride.creator===userId){
        return next(new ErrorHandler("You can't join your own ride",400));
    }
    if(ride.date<Date.now()){
        return next(new ErrorHandler("Ride has already passed",400));
    }
    ride.members.push(userId);
    await ride.save();
    const existingChat=await Chat.findOne({members:[ride.creator,userId],groupChat:false});
    if(!existingChat){
    const newChat=await Chat.create({
        name:ride.source+"to"+ride.destination+"("+ride.date+")",
        creator:ride.creator,
        members:[ride.creator,userId]
    });
    const memberIncludingCreator=[...ride.members,ride.creator];
    emitEvent(req, REFETCH_CHATS,memberIncludingCreator);
  }
    const user=await User.findById(ride.creator);
    if(ride.members.length===ride.seats){
        sendRideFullMail(user.email,ride.source+"to"+ride.destination,user.name);
    }
    else{
        const joiner=await User.findById(userId);
        sendRideJoinedMail(user.email,user.name,joiner.name,ride.description,ride.date);
    }
    return res.status(200).json({
        success:true,
        message:"Ride joined Successfully,You can now chat with the creator",
    });
});

const getAllUserJoinedRides=TryCatch(async(req,res,next)=>{
    const userId=req.user;
    const rides=await Ride.find({members:userId});
    res.status(200).json({
        success:true,
        data:rides
    })
});

export {
    newRideRequest,
    editRideRequest,
    deleteRideRequest,
    getRideRequest,
    getAllUserRides,
    joinRide,
    getAllUserJoinedRides,
    getAllRideRequests,
}
