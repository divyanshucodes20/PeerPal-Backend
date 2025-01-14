import { TryCatch } from "../middlewares/error.js";
import { Request, Response, NextFunction } from "express";
import {
  uploadFilesToCloudinary,
  deleteFromCloudinary,
  emitEvent,
} from "../utils/features.js";
import { ALERT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { db } from "../utils/prismaClient.js";
import ErrorHandler from "../utils/utility-class.js";

interface CustomRequest extends Request {
  user: {
    id: string;
  };
}

interface ChatMember {
  id: string;
  name: string;
  imageUrl: string;
  avatar?: { url: string };
}

interface Chat {
  id: string;
  name: string;
  members: ChatMember[];
  groupChat: boolean;
  creatorId: string;
}

const newGroupChat = TryCatch(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { name, members } = req.body;
  const allMembers = [...members, req.user.id];

  const newChat = await db.chat.create({
    data: {
      name,
      groupChat: true,
      creator: { connect: { id: req.user.id } },
      members: {
        connect: allMembers.map((memberId) => ({ id: memberId })),
      },
    },
  });

  emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
  emitEvent(req, REFETCH_CHATS, members);

  return res.status(201).json({
    success: true,
    message: "Group Created",
  });
});

const getMyChats = TryCatch(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const chats = await db.chat.findMany({
    where: { members: { some: { id: req.user.id } } },
    include: {
      members: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  const transformedChats = chats.map(({ id, name, members, groupChat }) => {
    const otherMember = getOtherMember(members, req.user);

    return {
      _id: id,
      groupChat,
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMember.avatar.url],
      name: groupChat ? name : otherMember.name,
      members: members
        .filter((member) => member.id !== req.user.id)
        .map((member) => member.id),
    };
  });

  return res.status(200).json({
    success: true,
    chats: transformedChats,
  });
});

const getMyGroups = TryCatch(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const chats = await db.chat.findMany({
    where: {
      members: { some: { id: req.user.id } },
      groupChat: true,
      creatorId: req.user.id,
    },
    include: {
      members: {
        select: {
          imageUrl: true,
        },
      },
    },
  });

  const groups = chats.map(({ id, name, members }) => ({
    _id: id,
    groupChat: true,
    name,
    avatar: members.slice(0, 3).map(({ imageUrl }) => imageUrl),
  }));

  return res.status(200).json({
    success: true,
    groups,
  });
});

const addMembers = TryCatch(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { chatId, members } = req.body;

  const chat = await db.chat.findUnique({
    where: { id: chatId },
    include: { members: true },
  });

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (chat.creatorId !== req.user.id)
    return next(new ErrorHandler("You are not allowed to add members", 403));

  const allNewMembers = await db.user.findMany({
    where: { id: { in: members } },
    select: { id: true, name: true },
  });

  const uniqueMembers = allNewMembers
    .filter((user) => !chat.members.some((member) => member.id === user.id))
    .map((user) => user.id);

  if (chat.members.length + uniqueMembers.length > 100)
    return next(new ErrorHandler("Group members limit reached", 400));

  await db.chat.update({
    where: { id: chatId },
    data: {
      members: {
        connect: uniqueMembers.map((userId) => ({ id: userId })),
      },
    },
  });

  const allUsersName = allNewMembers.map((user) => user.name).join(", ");

  emitEvent(req, ALERT, chat.members.map((member) => member.id), `${allUsersName} has been added in the group`);
  emitEvent(req, REFETCH_CHATS, chat.members.map((member) => member.id));

  return res.status(200).json({
    success: true,
    message: "Members added successfully",
  });
});

const removeMember = TryCatch(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { userId, chatId } = req.body;

  const chat = await db.chat.findUnique({
    where: { id: chatId },
    include: { members: true },
  });
  const userToBeRemoved = await db.user.findUnique({ where: { id: userId }, select: { name: true } });

  if (!chat) return next(new ErrorHandler("Chat not found", 404));
  if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 400));
  if (chat.creatorId !== req.user.id) return next(new ErrorHandler("You are not allowed to remove members", 403));
  if (chat.members.length <= 3)
    return next(new ErrorHandler("Group must have at least 3 members", 400));

  await db.chat.update({
    where: { id: chatId },
    data: {
      members: {
        disconnect: { id: userId },
      },
    },
  });

  emitEvent(req, ALERT, chat.members.map((member) => member.id), {
    message: `${userToBeRemoved?.name} has been removed from the group`,
    chatId,
  });

  emitEvent(req, REFETCH_CHATS, chat.members.map((member) => member.id));

  return res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
});

const leaveGroup = TryCatch(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const chatId = req.params.id;

  const chat = await db.chat.findUnique({
    where: { id: chatId },
    include: { members: true },
  });

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 400));

  const remainingMembers = chat.members.filter(
    (member) => member.id !== req.user.id
  );

  if (remainingMembers.length < 3)
    return next(new ErrorHandler("Group must have at least 3 members", 400));

  if (chat.creatorId === req.user.id) {
    const newCreator = remainingMembers[Math.floor(Math.random() * remainingMembers.length)];
    await db.chat.update({
      where: { id: chatId },
      data: { creatorId: newCreator.id },
    });
  }

  await db.chat.update({
    where: { id: chatId },
    data: {
      members: {
        disconnect: { id: req.user.id },
      },
    },
  });

  const [user] = await Promise.all([db.user.findUnique({ where: { id: req.user.id }, select: { name: true } })]);

  emitEvent(req, ALERT, chat.members.map((member) => member.id), {
    chatId,
    message: `User ${user?.name} has left the group`,
  });

  return res.status(200).json({
    success: true,
    message: "Leave Group Successfully",
  });
});

const sendAttachments = TryCatch(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { chatId } = req.body;
  const files: Express.Multer.File[] = req.files as Express.Multer.File[] || [];

  if (Array.isArray(files) && files.length < 1)
    return next(new ErrorHandler("Please Upload Attachments", 400));

  if (Array.isArray(files) && files.length > 5)
    return next(new ErrorHandler("Files Can't be more than 5", 400));

  const [chat, me] = await Promise.all([
    db.chat.findUnique({
      where: { id: chatId },
    }),
    db.user.findUnique({
      where: { id: req.user.id },
      select: { name: true },
    }),
  ]);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  // Upload files here
  const attachments = await uploadFilesToCloudinary(files);

  const messages = await db.message.createMany({
    data: attachments.map((attachment) => ({
      senderId: req.user.id,
      chatId,
      content: attachment.secure_url,
    })),
  });

  emitEvent(req, NEW_MESSAGE, chat.members.map((member) => member.id), { chatId, messages, senderName: me?.name });

  return res.status(200).json({
    success: true,
    messages,
  });
});

export { newGroupChat, getMyChats, getMyGroups, addMembers, removeMember, leaveGroup, sendAttachments };
