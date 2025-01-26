const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3000",
    process.env.CLIENT_URL,
  ],
  methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  credentials: true,
};

const CHATTU_TOKEN = "chattu-token";

export { corsOptions, CHATTU_TOKEN };
