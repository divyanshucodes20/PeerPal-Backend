import { TryCatch } from "../middlewares/error.js";
import { Ride } from "../models/ride.js";
import { ErrorHandler } from "../utils/utility.js";


const newRideRequest=TryCatch(async(req,res,next)=>{
    const {source,destination,prizePerPerson,seats,description,creator,date}=req.body;
    if(!source || !destination || !prizePerPerson || !seats || !description||!date){
        return next(new ErrorHandler("Please provide all the details",400));
    }
    const rideRequest=await Ride.create({
        source,
        destination,
        prizePerPerson,
        seats,
        description,
        creator,
        date
    });
    res.status(200).json({
        success:true,
        message:"Ride Request Created Successfully",
    })
})

const editRideRequest=TryCatch(async(req,res,next)=>{
  const {id}=req.params;
  const ride=await Ride.findById(id);
  if(!ride){
        return next(new ErrorHandler("Ride Request not found",404));
  } 
    const {source,destination,prizePerPerson,seats,description,date}=req.body;
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
    await ride.remove();
    res.status(200).json({
        success:true,
        message:"Ride Request Deleted Successfully",
    })
})
const getRideRequest=TryCatch(async(req,res,next)=>{
    const id=req.params.id;
    const ride=await Ride.findById(id);
    if(!ride){
        return next(new ErrorHandler("Ride Request not found",404));
    }
    res.status(200).json({
        success:true,
        data:ride
    })
});
const getAllUserRides=TryCatch(async(req,res,next)=>{
    const {id:creator}=req.query;
    const rides=await Ride.find({creator});
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
    getAllUserRides
}
