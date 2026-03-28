import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";

export const aiRouter = router({
  identifyStone: publicProcedure
    .input(z.object({ imageData: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a gemologist. Respond with JSON only: {\"stoneName\": \"\", \"confidence\": \"high/medium/low\", \"properties\": [], \"spiritualSignificance\": \"\"}",
            },
            {
              role: "user",
              content: "Identify this stone and respond with JSON only.",
            },
          ] as any,
        });

        const content = (response.choices[0]?.message?.content || "") as string;
        if (!content) {
          throw new Error("No response");
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonStr);

        return {
          stoneName: parsed.stoneName || "Unknown Stone",
          confidence: parsed.confidence || "medium",
          properties: Array.isArray(parsed.properties) ? parsed.properties : [],
          spiritualSignificance: parsed.spiritualSignificance || "A beautiful stone.",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to identify stone",
        });
      }
    }),
});
