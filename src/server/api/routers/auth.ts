import { router } from "../trpc";

// Legacy auth router disabled after migrating to Better Auth.
// Keep the router empty to avoid breaking existing imports during cleanup.
export const authRouter = router({});
