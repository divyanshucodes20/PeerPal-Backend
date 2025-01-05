import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { Redis } from "ioredis";
import { redis} from "../app.js";
import { InvalidateCacheProps} from "../types/types.js";

export function base64ToFile(base64: string, filename: string): Express.Multer.File {
  const buffer = Buffer.from(base64, 'base64');

  // Define the file object
  const file: Express.Multer.File = {
    fieldname: filename,
    originalname: filename,
    encoding: 'base64',
    mimetype: 'image/jpeg', // Set the appropriate mime type for the base64 string
    buffer,
    size: buffer.length,
    stream: null as any, // The stream is not needed for your use case
    destination: '', // You can leave it as an empty string since it's not used in this case
    filename: filename,
    path: '', // You can leave it as an empty string since it's not used
  };

  return file;
}


export const uploadToCloudinary = async (files: (Express.Multer.File | string)[]) => {
  const promises = files.map(async (file) => {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      // Check if the input is a file or base64 string
      if (typeof file === 'string') {
        // Base64 string upload
        cloudinary.uploader.upload(file, { resource_type: 'auto' }, (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        });
      } else {
        // File buffer upload
        cloudinary.uploader.upload_stream(
          { resource_type: 'auto' }, // Automatically detect resource type (image/video, etc.)
          (error, result) => {
            if (error) return reject(error);
            resolve(result!);
          }
        ).end(file.buffer); // Stream the file buffer to Cloudinary
      }
    });
  });

  const result = await Promise.all(promises);

  return result.map((i) => ({
    public_id: i.public_id,
    url: i.secure_url,
  }));
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


