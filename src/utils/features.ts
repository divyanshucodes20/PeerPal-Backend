import {v2 as cloudinary } from "cloudinary";
import { Redis } from "ioredis";
import { redis} from "../app.js";
import { InvalidateCacheProps} from "../types/types.js";
import { getBase64, getSockets } from "../lib/helper.js";
import { v4 as uuid } from "uuid";




export const uploadFilesToCloudinary = async (files = []) => {
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

    const formattedResults = results.map((result:any) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formattedResults;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Error uploading files to cloudinary: ${err.message}`);
    } else {
      throw new Error(`Error uploading files to cloudinary: ${err}`);
    }
  }
};

export const deleteFromCloudinary = async (publicIds: string[]) => {
  const promises = publicIds.map((id) => {
    return new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error, result) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  await Promise.all(promises);
};

export const connectRedis = (redisURI: string) => {
  const redis = new Redis(redisURI);

  redis.on("connect", () => console.log("Redis Connected"));
  redis.on("error", (e) => console.log(e));

  return redis;
};

export const invalidateCache = async ({
  product,
  order,
  admin,
  review,
  userId,
  orderId,
  productId,
  reUsableProduct,
  reUsableProductId
}: InvalidateCacheProps) => {
  if (review) {
    await redis.del([`reviews-${productId}`]);
  }

  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => productKeys.push(`product-${i}`));

    await redis.del(productKeys);
  }
  if(reUsableProduct){
    const productKeys: string[] = [
      "latest-reusable-products",
      "reusable-categories",
      "all-resuable-products",
    ];

    if (typeof reUsableProductId === "string") productKeys.push(`reusable-product-${reUsableProductId}`);

    if (typeof reUsableProductId === "object")
      reUsableProductId.forEach((i) => productKeys.push(`reusable-product-${i}`));

    await redis.del(productKeys);
  }
  if (order) {
    const ordersKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    await redis.del(ordersKeys);
  }
  if (admin) {
    await redis.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};


interface EmitEventProps {
  req: Express.Request;
  event: string;
  users: string[];
  data: any;
}

declare global {
  namespace Express {
    interface Application {
      get: (name: string) => any;
    }
    interface Request {
      app: Application;
    }
  }
}

export const emitEvent = ({ req, event, users, data }: EmitEventProps) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};