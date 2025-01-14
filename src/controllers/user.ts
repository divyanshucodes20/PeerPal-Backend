import { NextFunction, Request, Response } from 'express';
import { TryCatch } from '../middlewares/error.js';
import { db } from '../utils/prismaClient.js';
import ErrorHandler from '../utils/utility-class.js';

export const checkUser = TryCatch(async (req: Request, res: Response,next:NextFunction) => {
  // Assert req.auth to avoid TypeScript error
  const user = (req as any).auth?.user;
  if (!user) {
    return next(new ErrorHandler('User not authenticated', 401));
  }

  // Try to find the user in your Prisma database
  const loggedInUser = await db.user.findUnique({
    where: {
      clerkUserId: user.id, // Use Clerk's user ID to look up the user
    },
  });

  if (loggedInUser) {
    return res.status(200).json(loggedInUser);
  }

  // If the user doesn't exist, create a new user record
  const newUser = await db.user.create({
    data: {
      clerkUserId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
    },
  });

  return res.status(201).json(newUser);
});
export const getUser = TryCatch(async (req: Request, res: Response,next:NextFunction) => {
  const user = (req as any).auth?.user;
  if (!user) {
    return next(new ErrorHandler('User not authenticated', 401));
  }
  const loggedInUser = await db.user.findUnique({
    where: {
      clerkUserId: user.id,
    },
  });
  if(!loggedInUser){
    return next(new ErrorHandler('User not found', 404));
  }
  return res.status(200).json(loggedInUser);
});
export const updateUser = TryCatch(async (req: Request, res: Response,next:NextFunction) => {
  const user = (req as any).auth?.user;
  if (!user) {
    return next(new ErrorHandler('User not authenticated', 401));
  }
  const loggedInUser = await db.user.findUnique({
    where: {
      clerkUserId: user.id,
    },
  });
  if(!loggedInUser){
    return next(new ErrorHandler('User not found', 404));
  }
  const updatedUser = await db.user.update({
    where: {
      clerkUserId: user.id,
    },
    data: req.body,
  });
  return res.status(200).json(updatedUser);
});