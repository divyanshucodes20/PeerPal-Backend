import prisma from "../utils/prismaClient.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { hash } from "bcrypt";
import { Request, Response, NextFunction } from "express";
import { NewUserRequestBody } from "../types/types.js";
import { base64ToFile, deleteFromCloudinary, uploadToCloudinary } from "../utils/features.js";


// ✅ Get All Users
export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await prisma.user.findMany();

  return res.status(200).json({
    success: true,
    users,
  });
});

// ✅ Get User by ID
export const getUser = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid Id", 400));
  }

  return res.status(200).json({
    success: true,
    user,
  });
});

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, avatarPublicId, avatarUrl, password, isGoogleSignedIn } = req.body;

    // Check if the user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`,
      });
    }

    // Default role is 'USER' if not specified
    const userRole = req.body.role || 'USER';

    // ✅ Google Sign-In User
    if (isGoogleSignedIn) {
      if (!name || !email || !photo) {
        return next(new ErrorHandler("Google users must provide name, email, and photo", 400));
      }

      user = await prisma.user.create({
        data: {
          name,
          email,
          photo,
          isGoogleSignedIn: true,
          role: userRole, // Set role
        },
      });
    } else {
      // ✅ Non-Google User
      if (!name || !email || !password || !avatarPublicId || !avatarUrl) {
        return next(new ErrorHandler("Please provide all required fields", 400));
      }

      // Upload photo to Cloudinary if provided and it's base64
      let uploadedPhoto = null;
      if (photo) {
        // If the photo is base64 string, we can upload it directly
        uploadedPhoto = await uploadToCloudinary([photo]); // Assume photo is base64 string
      }

      // Hash the password
      const hashedPassword = await hash(password, 10);

      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          avatarPublicId: uploadedPhoto?.[0].public_id,
          avatarUrl: uploadedPhoto?.[0].url,
          isGoogleSignedIn: false,
          role: userRole, // Set role
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  }
);


export const updateUser = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { name, photo, avatarPublicId, avatarUrl, password } = req.body;

  // Find user by ID
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) return next(new ErrorHandler("User not found", 404));

  let updateData: { name: string; avatarPublicId: string; avatarUrl: string; password?: string } = {
    name,
    avatarPublicId,
    avatarUrl,
  };

  // Handle photo upload (if photo is provided)
  if (photo) {
    // If the photo is a base64 string, convert it to a file object
    let photoFile;
    if (typeof photo === 'string') {
      photoFile = base64ToFile(photo, "photo.jpg"); // Convert base64 string to file object
    } else {
      photoFile = photo; // Directly use the file if it's a buffer
    }

    // Delete previous photo from Cloudinary if it exists
    if (user.avatarPublicId) {
      await deleteFromCloudinary([user.avatarPublicId]);
    }

    // Upload new photo to Cloudinary
    const uploaded = await uploadToCloudinary([photoFile]);
    updateData.avatarPublicId = uploaded[0].public_id;
    updateData.avatarUrl = uploaded[0].url;
  }

  // Handle password update if provided
  if (password) {
    const hashedPassword = await hash(password, 10);
    updateData.password = hashedPassword;
  }

  // Update the user in the database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return res.status(200).json({
    success: true,
    message: "User updated successfully",
    user: updatedUser,
  });
});


// ✅ Delete User API (Delete from Cloudinary as well)
export const deleteUser = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  // Find user by ID
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid Id", 400));
  }

  // If the user has an avatar, delete it from Cloudinary
  if (user.avatarPublicId) {
    await deleteFromCloudinary([user.avatarPublicId]);
  }

  // Delete the user
  await prisma.user.delete({
    where: { id },
  });

  return res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});


