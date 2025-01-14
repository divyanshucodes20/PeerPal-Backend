import express from "express";
import { connectRedis } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import { config } from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";
import contactRoutes from "./routes/contact.js";
import { clerkClient, clerkMiddleware } from "@clerk/express";
import  userRoutes from "./routes/user.js";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import {corsOptions} from "./constants/config.js";
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/events.js";
import { v4 as uuid } from "uuid";
import { db } from "./utils/prismaClient.js";
import { getSockets } from "./lib/helper.js";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const redisURI = process.env.REDIS_URI || "";
const envMode = process.env.NODE_ENV?.trim() || "PRODUCTION";
export const redisTTL = process.env.REDIS_TTL || 60 * 60 * 4;
const userSocketIDs = new Map();
const onlineUsers = new Set();

export const redis = connectRedis(redisURI);
export const resend = new Resend(process.env.RESEND_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});


const app = express();
app.use(clerkMiddleware());
const server=createServer(app);
const io=new Server(server,{
  cors:corsOptions
});
app.set("io",io);

app.use(express.json());
app.use(morgan("dev"));
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("API Working with /api/v1");
});

// Using Routes
app.use("/api/v1/contact", contactRoutes);
app.get('/api/v1/user',userRoutes);

interface CustomSocket extends Socket {
  user?: any;
}

io.use(async (socket: CustomSocket, next) => {
  try {
    const sessionId = Array.isArray(socket.handshake.headers["x-clerk-session-id"])
      ? socket.handshake.headers["x-clerk-session-id"][0]
      : socket.handshake.headers["x-clerk-session-id"];

    const token = Array.isArray(socket.handshake.headers["x-clerk-token"])
      ? socket.handshake.headers["x-clerk-token"][0]
      : socket.handshake.headers["x-clerk-token"];

    if (!sessionId || !token) {
      return next(new Error("Session ID or Authentication token is missing"));
    }

    const session = await clerkClient.sessions.verifySession(sessionId, token);

    if (!session) {
      return next(new Error("Authentication failed"));
    }

    // Attach only userId to socket
    const user=await clerkClient.users.getUser(session.userId);
    socket.user = user;
    next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
});




// WebSocket Connection Logic
io.on("connection", (socket: CustomSocket) => {
  const user = socket.user;
  userSocketIDs.set(user.id.toString(), socket.id); // Map user socket ID

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    try {
      const messageForRealTime = {
        content: message,
        _id: uuid(),
        sender: {
          _id: user.id,
          name: user.firstName + " " + user.lastName,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };

      // Store the message in the database using Prisma
      await db.message.create({
        data: {
          content: message,
          senderId: user.id,
          chatId: chatId,
        },
      });

      // Emit the message to the relevant users
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });

      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
    } catch (error) {
      console.error("Error handling new message:", error);
    }
  });

  socket.on(START_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(START_TYPING, { chatId });
  });

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, { chatId });
  });

  socket.on(CHAT_JOINED, ({ userId, members }) => {
    onlineUsers.add(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on(CHAT_LEAVED, ({ userId, members }) => {
    onlineUsers.delete(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on("disconnect", () => {
    userSocketIDs.delete(user.id.toString());
    onlineUsers.delete(user.id.toString());
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
  });
});


app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`Server is running on port ${port} in ${envMode} Mode`);
});
export { envMode,userSocketIDs };
