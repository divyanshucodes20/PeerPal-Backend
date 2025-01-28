import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";
import  {VerificationEmail}  from "../emails/verification.js" 
import { resend } from "../app.js";
import {requestDeletionEmail,requestDeletionEmailByCreator, requestRemovalEmail, userLeftRequestEmail} from "../emails/requestDeletion.js"
import { learnerRequestFullEmail, newLearnerJoinedEmail, rideRequestJoinedEmail, rideSeatsFullEmail, roommateRequestJoinedEmail} from "../emails/seatsFull.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: "PeerPal" })
    .then((data) => console.log(`Connected to DB: ${data.connection.host}`))
    .catch((err) => {
      throw err;
    });
};

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res.status(code).cookie("chattu-token", token, cookieOptions).json({
    success: true,
    user,
    message,
  });
};

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);

    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formattedResults;
  } catch (err) {
    throw new Error("Error uploading files to cloudinary", err);
  }
};
export const deleteFromCloudinary = async (publicIds) => {
  // Ensure publicIds is an array, even if a single string is passed
  const ids = Array.isArray(publicIds) ? publicIds : [publicIds];
  
  const promises = ids.map((id) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error, result) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw new Error("Failed to delete avatar from Cloudinary");
  }
};

export async function sendVerificationEmail(
  email,
  username,
  verifyCode
) {
  try {
    await resend.emails.send({
      from: 'PeerPal<onboarding@divyanshucodings.live>',
      to: email,
      subject: 'PeerPal | verification code',
      html:VerificationEmail({ username, otp: verifyCode }),
    });
    return { success: true, message: "email sent successfully" };
  } catch (emailError) {
    console.error("Error in sending verification email", emailError);
    return { success: false, message: "failed to send verification email" };
  }
}
export async function sendRequestDeletionEmail(
  email,
  requestType,
  username,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your ${requestType} request`,
      html:requestDeletionEmail({ username, requestType }),
    });
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}
export async function sendRideFullMail(
  email,
  rideName,
  creatorName,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your Ride Request`,
      html:rideSeatsFullEmail({rideName, creatorName }),
    });
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}
export async function sendRideJoinedMail(
  email,
  creatorName,
  joinerName,
  rideDetails,
  rideDate,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your Ride Request`,
      html:rideRequestJoinedEmail({creatorName, joinerName,rideDetails,rideDate}),
    });
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}
export async function sendRoommateJoinedMail(
  email,
  creatorName,
  joinerName,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your Roommate Request`,
      html:roommateRequestJoinedEmail({creatorName, joinerName}),
    });
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}
export async function sendLearnerRequestFullMail(
  email,
  topic,
  teamSize,
  creatorName,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your Learner Request`,
      html:learnerRequestFullEmail({creatorName,topic,teamSize}),
    });
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}
export async function sendLearnerJoinedMail(
  email,
  creatorName,
  learnerName,
  topic,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your Learner Request`,
      html:newLearnerJoinedEmail({creatorName, learnerName,topic}),
    });
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}
export async function sendRequestDeletionEmailToMembers(
  email,
  requestType,
  username,
  creatorName,
  requestName,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your ${requestType} request`,
      html:requestDeletionEmailByCreator({creatorName,requestName,username,requestType}),
    });
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}
export async function sendRequestOutMail(
  email,
  requestType,
  username,
  creatorName,
  requestName,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your ${requestType} request`,
      html:requestRemovalEmail({creatorName,requestName,username,requestType}),
    });
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}

export async function generateProjectSuggestions(project, goals) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this project and its goals, and provide 3 concise, actionable suggestions.
    Focus on project goals, current progress, team collaboration, and areas of improvement.
    Keep it friendly and constructive.

    Project Details:
    - Name: ${project.name}
    - Type: ${project.type}
    - Team Size: ${project.teamSize}
    - Creator: ${project.creator}
    - Members: ${project.members.length}
    - Group Chat: ${project.groupChat ? "Enabled" : "Not Available"}
    - Learner ID: ${project.learnerId}

    Goals:
    ${goals.map((goal, index) => `Goal ${index + 1}: ${goal.title} - ${goal.description} (Completed: ${goal.completed})`).join("\n")}

    Format the response as a JSON array of strings, like this:
    ["suggestion 1", "suggestion 2", "suggestion 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating project suggestions:", error);
    return [
      "Ensure the team is aligned with project goals and deadlines.",
      "Identify and address key challenges early to prevent delays.",
      "Regularly review progress to stay on track with milestones.",
    ];
  }
}
export async function sendUserLeftMailToCreator(
  email,
  requestType,
  username,
  creatorName,
  requestName,
){
  try {
    await resend.emails.send({
      from: 'PeerPal<alert@divyanshucodings.live>',
      to: email,
      subject: `Update on your ${requestType} request`,
      html:userLeftRequestEmail({creatorName,requestName,requestType,username}),
    });   
    return { success: true, message: "email sent successfully" };
}
catch (emailError) {
    console.error("Error in sending updation email", emailError);
    return { success: false, message: "failed to send updation email" };
}
}  

export {
  connectDB,
  sendToken,
  cookieOptions,
  emitEvent,
  uploadFilesToCloudinary,
};
