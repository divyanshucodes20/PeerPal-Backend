import express from "express";
import { connectRedis } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import { config } from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";
import pg from "pg";
import userRoute from "./routes/user.js";
import contactRoutes from "./routes/contact.js";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const redisURI = process.env.REDIS_URI || "";
const clientURL = process.env.CLIENT_URL || "";
export const redisTTL = process.env.REDIS_TTL || 60 * 60 * 4;

export const redis = connectRedis(redisURI);
export const resend = new Resend(process.env.RESEND_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const dbConfig = {
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || "5432"),
  database: process.env.PG_DATABASE,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.PG_SSL_CA,
  },
};

const dbClient = new pg.Client(dbConfig);

dbClient.connect((err) => {
  if (err) {
    console.error("Failed to connect to PostgreSQL database:", err);
  } else {
    console.log("Connected to PostgreSQL database.");
  }
});

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: [clientURL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("API Working with /api/v1");
});

// Using Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/contact", contactRoutes);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Express is working on http://localhost:${port}`);
});
