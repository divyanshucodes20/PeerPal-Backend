import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import {
  emitEvent,
  uploadFilesToCloudinary,
  deleteFromCloudinary,
  sendUserLeftMailToCreator
} from "../utils/features.js";
import {
  ALERT,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { User } from "../models/user.js";
import { Message } from "../models/message.js";
import { Project } from "../models/project.js";
import { Learner } from "../models/learner.js";

const newGroupChat = TryCatch(async (req, res, next) => {
  const { name, members,isProject } = req.body;

  const allMembers = [...members, req.user];

  const chat=await Chat.create({
    name,
    groupChat: true,
    creator: req.user,
    members: allMembers,
    isProject
  });
   if(isProject){
    const project=await Project.create({
      name,
      groupChat:chat._id,
      creator:req.user,
      members:allMembers,
      type:"group"
    })
   }
  emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
  emitEvent(req, REFETCH_CHATS, members);

  return res.status(201).json({
    success: true,
    message: `${isProject}?Project Group Created Successfully:Group Created Successfully`,
  });
});

const getMyChats = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({ members: req.user }).populate(
    "members",
    "name avatar"
  );

  const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherMember(members, req.user);

    return {
      _id,
      groupChat,
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMember.avatar.url],
      name: groupChat ? name : otherMember.name,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.user.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
    };
  });

  return res.status(200).json({
    success: true,
    chats: transformedChats,
  });
});

const getMyGroups = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({
    members: req.user,
    groupChat: true,
    creator: req.user,
  }).populate("members", "name avatar");

  const groups = chats.map(({ members, _id, groupChat, name }) => ({
    _id,
    groupChat,
    name,
    avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
  }));

  return res.status(200).json({
    success: true,
    groups,
  });
});

const addMembers = TryCatch(async (req, res, next) => {
  const { chatId, members } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (chat.creator.toString() !== req.user.toString())
    return next(new ErrorHandler("You are not allowed to add members", 403));

  const allNewMembersPromise = members.map((i) => User.findById(i, "name"));

  const allNewMembers = await Promise.all(allNewMembersPromise);

  const uniqueMembers = allNewMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);

  chat.members.push(...uniqueMembers);

  if (chat.members.length > 100)
    return next(new ErrorHandler("Group members limit reached", 400));

  await chat.save();
  
  if(chat.isProject){
    const project=await Project.findById({groupChat:chatId});
    project.members.push(...uniqueMembers);
    await project.save();
    if(project.learnerId){
      const learner=await Learner.findById(project.learnerId);
      learner.members.push(...uniqueMembers);
      await learner.save();
    }
  }

  const allUsersName = allNewMembers.map((i) => i.name).join(", ");

  emitEvent(
    req,
    ALERT,
    chat.members,
    `${allUsersName} has been added in the group`
  );

  emitEvent(req, REFETCH_CHATS, chat.members);

  return res.status(200).json({
    success: true,
    message: "Members added successfully",
  });
});

const removeMember = TryCatch(async (req, res, next) => {
  const { userId, chatId } = req.body;

  const [chat, userThatWillBeRemoved] = await Promise.all([
    Chat.findById(chatId),
    User.findById(userId, "name"),
  ]);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (chat.creator.toString() !== req.user.toString())
    return next(new ErrorHandler("You are not allowed to add members", 403));

  if (chat.members.length <= 3)
    return next(new ErrorHandler("Group must have at least 3 members", 400));

  const allChatMembers = chat.members.map((i) => i.toString());

  chat.members = chat.members.filter(
    (member) => member.toString() !== userId.toString()
  );
  if(chat.isProject){
    const project=await Project.findById({groupChat:chatId});
    project.members=project.members.filter(member=>member.toString()!==userId.toString());
    await project.save();
    if(project.learnerId){
      const learner=await Learner.findById(project.learnerId);
      learner.members=learner.members.filter(member=>member.toString()!==userId.toString());
      await learner.save();
    }
  }
  await chat.save();

  emitEvent(req, ALERT, chat.members, {
    message: `${userThatWillBeRemoved.name} has been removed from the group`,
    chatId,
  });

  emitEvent(req, REFETCH_CHATS, allChatMembers);

  return res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
});

const leaveGroup = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  const remainingMembers = chat.members.filter(
    (member) => member.toString() !== req.user.toString()
  );

  if (remainingMembers.length < 3)
    return next(new ErrorHandler("Group must have at least 3 members", 400));

  if (chat.creator.toString() === req.user.toString()) {
    return next(new ErrorHandler("make someone else admin to leave this chat", 400));
  }

  chat.members = remainingMembers;
  const [user] = await Promise.all([
    User.findById(req.user, "name"),
    chat.save(),
  ]);
  if(chat.isProject){
    const project=await Project.find({groupChat:chatId});
    if(!project){
      return next(new ErrorHandler("Project not found",404));
    }
    const creator=await User.findById(project.creator);
    project.members=remainingMembers;
    await project.save();
    sendUserLeftMailToCreator(creator.email,"Project",user.name,project.name,project.name);
    if(project.learnerId){
      const learner=await Learner.findById(project.learnerId);
      if(!learner){
        return next(new ErrorHandler("Learner Request not found",400))
      }
      learner.members=remainingMembers;
      await learner.save();
    }
  }

  emitEvent(req, ALERT, chat.members, {
    chatId,
    message: `User ${user.name} has left the group`,
  });

  return res.status(200).json({
    success: true,
    message: "Leave Group Successfully",
  });
});

const sendAttachments = TryCatch(async (req, res, next) => {
  const { chatId } = req.body;

  const files = req.files || [];

  if (files.length < 1)
    return next(new ErrorHandler("Please Upload Attachments", 400));

  if (files.length > 5)
    return next(new ErrorHandler("Files Can't be more than 5", 400));

  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user, "name"),
  ]);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (files.length < 1)
    return next(new ErrorHandler("Please provide attachments", 400));

  //   Upload files here
  const attachments = await uploadFilesToCloudinary(files);

  const messageForDB = {
    content: "",
    attachments,
    sender: me._id,
    chat: chatId,
  };

  const messageForRealTime = {
    ...messageForDB,
    sender: {
      _id: me._id,
      name: me.name,
    },
  };

  const message = await Message.create(messageForDB);

  emitEvent(req, NEW_MESSAGE, chat.members, {
    message: messageForRealTime,
    chatId,
  });

  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

  return res.status(200).json({
    success: true,
    message,
  });
});

const getChatDetails = TryCatch(async (req, res, next) => {
  if (req.query.populate === "true") {
    const chat = await Chat.findById(req.params.id)
      .populate("members", "name avatar")
      .lean();

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    chat.members = chat.members.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url,
    }));

    return res.status(200).json({
      success: true,
      chat,
    });
  } else {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    return res.status(200).json({
      success: true,
      chat,
    });
  }
});

const renameGroup = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const { name } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (chat.creator.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not allowed to rename the group", 403)
    );

  chat.name = name;
  if(chat.isProject){
    const project=await Project.findById({groupChat:chatId});
    if(!project){
      return next(new ErrorHandler("Project not found",404));
    }
    project.name=name;
    await project.save();
    if(project.learnerId){
      const learner=Learner.findById(project.learnerId);
      if(!learner){
        return next(new ErrorHandler("Learner Request not found",400))
      }
      learner.title=name;
      await learner.save();
    }
  }
  await chat.save();

  emitEvent(req,ALERT,chat.members,{
    message:`Group Name Changed to ${name}`,
    chatId
  })

  emitEvent(req, REFETCH_CHATS, chat.members);

  return res.status(200).json({
    success: true,
    message: "Group renamed successfully",
  });
});

const deleteChat = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  const members = chat.members;

  if (chat.groupChat && chat.creator.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not allowed to delete the group", 403)
    );

  if (!chat.groupChat && !chat.members.includes(req.user.toString())) {
    return next(
      new ErrorHandler("You are not allowed to delete the chat", 403)
    );
  }

  //   Here we have to dete All Messages as well as attachments or files from cloudinary

  const messagesWithAttachments = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $ne: [] },
  });

  const public_ids = [];

  messagesWithAttachments.forEach(({ attachments }) =>
    attachments.forEach(({ public_id }) => public_ids.push(public_id))
  );

  await Promise.all([
    deleteFromCloudinary(public_ids),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);
  if(chat.isProject){
    const project=await Project.find({groupChat:chatId});
    if(project.learnerId){
      const learner=await Learner.findById(project.learnerId);
      await Learner.deleteOne(project.learnerId);
    }
    await Project.deleteOne(project._id);
  } 
  emitEvent(req, REFETCH_CHATS, members);

  return res.status(200).json({
    success: true,
    message: `Chat ${chat.isProject}?as well as project deleted successfully: deleted successfully`,
  });
});

const getMessages = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const { page = 1 } = req.query;

  const resultPerPage = 20;
  const skip = (page - 1) * resultPerPage;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.members.includes(req.user.toString()))
    return next(
      new ErrorHandler("You are not allowed to access this chat", 403)
    );

  const [messages, totalMessagesCount] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(resultPerPage)
      .populate("sender", "name")
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

  return res.status(200).json({
    success: true,
    messages: messages.reverse(),
    totalPages,
  });
});
const changeAdmin=TryCatch(
  async(req,res,next)=>{
    const chatId=req.params.id;
    const {userId}=req.body;
    const [chat,user]=await Promise.all([
      Chat.findById(chatId),
      User.findById(userId)
    ])
    if(!chat) return next(new ErrorHandler("Chat not found",404));
    if(!chat.groupChat) return next(new ErrorHandler("This is not a group chat",400));
    if(chat.creator.toString()!==req.user.toString()) return next(new ErrorHandler("You are not allowed to change admin",403));
    if(!chat.members.includes(userId)) return next(new ErrorHandler("User is not a member of this group",400));
    if(!user) return next(new ErrorHandler("User not found",404));

    if(chat.creator.toString()===userId.toString()){
      return next(new ErrorHandler(`${user.name} is already Admin`,404));
    }

    chat.creator=userId;
    if(chat.isProject){
      const project=await Project.findById({groupChat:chatId});
      if(!project){
        return next(new ErrorHandler("Project not found",404));
      }
      project.creator=userId;
      await project.save();
      if(project.learnerId){
        const learner=await Learner.findById(project.learnerId);
        if(!learner){
          return next(new ErrorHandler("Learner Request not found",404))
        }
        learner.creator=userId;
        await learner.save();
      }
    }
    await chat.save();
    emitEvent(req,ALERT,chat.members,{
      message:`Admin has been changed to ${user.name}`,
      chatId
    })
    emitEvent(req,REFETCH_CHATS,chat.members);
    return res.status(200).json({
      success:true,
      message:`${chat.isProject}?Project Creator as well as Group Admin Chnaged Successfully: Admin changed successfully`
    })
  }
)


export {
  newGroupChat,
  getMyChats,
  getMyGroups,
  addMembers,
  removeMember,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
  changeAdmin
};
