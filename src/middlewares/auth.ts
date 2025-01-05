import prisma from "../utils/prismaClient.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

// Middleware to make sure only admin is allowed
export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Please login first", 401));

  // Fetch user by ID using Prisma
  const user = await prisma.user.findUnique({
    where: {
      id: String(id), // Ensure ID is passed as a string
    },
  });

  if (!user) return next(new ErrorHandler("Please login first", 401));

  if (user.role !== "ADMIN")
    return next(new ErrorHandler("You are not an admin to access this", 403));

  next();
});
