import { NextFunction, Request, Response } from "express";

// types/userTypes.ts
export type NewUserRequestBody = {
  name: string;
  email: string;
  photo?: string; // Optional for Google users
  avatarPublicId?: string; // Required for non-Google users
  avatarUrl?: string; // Required for non-Google users
  password?: string; // Required for non-Google users
  isGoogleSignedIn: boolean;
  role?: 'ADMIN' | 'USER'; // Optional, defaults to 'USER'
};


export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;


export type InvalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  review?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
  reUsableProduct?: boolean;
  reUsableProductId?: string| string[];
};
export type ContactRequestBody = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

