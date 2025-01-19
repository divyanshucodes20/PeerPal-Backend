import jwt from "jsonwebtoken";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { ErrorHandler } from "../utils/utility.js";
import { cookieOptions, sendRequestDeletionEmail } from "../utils/features.js";
import { adminSecretKey } from "../app.js";
import { Ride } from "../models/ride.js";
import {Roommate} from "../models/roommate.js"
import { Learner } from "../models/learner.js";
import { Project } from "../models/project.js";

const adminLogin = TryCatch(async (req, res, next) => {
  const { secretKey } = req.body;

  const isMatched = secretKey === adminSecretKey;

  if (!isMatched) return next(new ErrorHandler("Invalid Admin Key", 401));

  const token = jwt.sign(secretKey, process.env.JWT_SECRET);

  return res
    .status(200)
    .cookie("chattu-admin-token", token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 15,
    })
    .json({
      success: true,
      message: "Authenticated Successfully, Welcome BOSS",
    });
});

const adminLogout = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("chattu-admin-token", "", {
      ...cookieOptions,
      maxAge: 0,
    })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
});

const getAdminData = TryCatch(async (req, res, next) => {
  return res.status(200).json({
    admin: true,
  });
});

const allUsers = TryCatch(async (req, res) => {
  const users = await User.find({});

  const transformedUsers = await Promise.all(
    users.map(async ({ name, username, avatar, _id }) => {
      const [groups, friends] = await Promise.all([
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
      ]);

      return {
        name,
        username,
        avatar: avatar.url,
        _id,
        groups,
        friends,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    users: transformedUsers,
  });
});

const allRides = TryCatch(async (req, res) => {
  const rides=await Ride.find({});
  return res.status(200).json({
    status: "success",
    rides: rides,
  });
});

const allRoommates = TryCatch(async (req, res) => {
  const roommates=await Roommate.find({});
  return res.status(200).json({
    status: "success",
    roommates: roommates,
  });
});
const allLearners = TryCatch(async (req, res) => {
  const learners=await Learner.find({});
  return res.status(200).json({
    status: "success",
    learners: learners,
  });
});
const allProjects = TryCatch(async (req, res) => {
  const projects=await Project.find({});
  return res.status(200).json({
    status: "success",
    projects: projects,
  });
});
const deleteRideRequest=TryCatch(async(req,res)=>{
  const {id}=req.params;
  const ride=await Ride.findById(id);
  if(!ride){
    return next(new ErrorHandler("Ride Request Not Found",404));
  }
  const user=await User.findById(ride.creator);
  if(!user){
    return next(new ErrorHandler("User Not Found",404));
  }
  sendRequestDeletionEmail(user.email,"Ride",user.name);
  return res.status(200).json({
    status: "success",
    message: "Ride Request Deleted Successfully",
  });
});
const deleteRoommateRequest=TryCatch(async(req,res)=>{
  const {id}=req.params;
  const roommate=await Roommate.findById(id);
  if(!roommate){
    return next(new ErrorHandler("Roommate Request Not Found",404));
  }
  const user=await User.findById(roommate.creator);
  if(!user){
    return next(new ErrorHandler("User Not Found",404));
  }
   sendRequestDeletionEmail(user.email,"Roommate",user.name);
  return res.status(200).json({
    status: "success",
    message: "Roommate Request Deleted Successfully",
  });
});
const deleteLearnerRequest=TryCatch(async(req,res)=>{
  const {id}=req.params;
  const learner=await Learner.findById(id);
  if(!learner){
    return next(new ErrorHandler("Learner Request Not Found",404));
  }
  const user=await User.findById(learner.creator);
  if(!user){
    return next(new ErrorHandler("User Not Found",404));
  }
   sendRequestDeletionEmail(user.email,"Learner",user.name);
  return res.status(200).json({
    status: "success",
    message: "Learner Request Deleted Successfully",
  });
});


const allChats = TryCatch(async (req, res) => {
  const chats = await Chat.find({})
    .populate("members", "name avatar")
    .populate("creator", "name avatar");

  const transformedChats = await Promise.all(
    chats.map(async ({ members, _id, groupChat, name, creator }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });

      return {
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map((member) => member.avatar.url),
        members: members.map(({ _id, name, avatar }) => ({
          _id,
          name,
          avatar: avatar.url,
        })),
        creator: {
          name: creator?.name || "None",
          avatar: creator?.avatar.url || "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    chats: transformedChats,
  });
});

const allMessages = TryCatch(async (req, res) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");

  const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments,
      content,
      createdAt,
      chat: chat._id,
      groupChat: chat.groupChat,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    })
  );

  return res.status(200).json({
    success: true,
    messages: transformedMessages,
  });
});

const getDashboardStats = TryCatch(async (req, res) => {
  const [groupsCount, usersCount, messagesCount, totalChatsCount,totalRidesCount,totalRoommateRequestCount,totalLearnerRequest] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),
      Ride.countDocuments(),
      Roommate.countDocuments(),
      Learner.countDocuments()
    ]);

  const today = new Date();

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const last7DaysMessages = await Message.find({
    createdAt: {
      $gte: last7Days,
      $lte: today,
    },
  }).select("createdAt");

  const messages = new Array(7).fill(0);
  const dayInMiliseconds = 1000 * 60 * 60 * 24;

  last7DaysMessages.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
    const index = Math.floor(indexApprox);

    messages[6 - index]++;
  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCount,
    messagesChart: messages,
    totalRidesCount,
    totalRoommateRequestCount,
    totalLearnerRequest
  };

  return res.status(200).json({
    success: true,
    stats,
  });
});

export {
  allUsers,
  allChats,
  allMessages,
  getDashboardStats,
  adminLogin,
  adminLogout,
  getAdminData,
  allRides,
  allRoommates,
  deleteRideRequest,
  deleteRoommateRequest,
  deleteLearnerRequest,
  allLearners,
  allProjects
};
