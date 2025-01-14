import { NextFunction, Request, Response } from "express";

// types/userTypes.ts
// types/userTypes.ts
export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  clerkUserId: string;
}



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

