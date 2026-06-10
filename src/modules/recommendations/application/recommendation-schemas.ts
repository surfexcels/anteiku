import { z } from "zod";

export const updateRecommendationSchema = z.object({
  status: z.enum(["reviewed", "accepted", "dismissed"]),
});
