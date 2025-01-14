import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY, // Your Clerk Secret API Key
});

export { clerkClient };
