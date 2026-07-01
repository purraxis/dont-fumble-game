import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  packName: z.string().min(1),
});

const FeedbackSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.string().min(1).max(60),
  what_worked: z.string().min(1).max(280),
  what_fumbled: z.string().min(1).max(280),
  better_answer: z.string().min(1).max(280),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

export const generateFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<Feedback> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const system = `You are the sassy, unhinged AI judge for "Don't Fumble", a viral couples challenge game. Someone's partner just answered an absurd relationship trap question. Score them 0-100 on whether they fumbled or cooked. Be funny, punchy, chronically online — like a group chat friend roasting them. Never mean-spirited, never political, PG-13 max. Keep every field short (one or two sentences). Return only JSON matching the schema.`;

    const user = `Question pack: ${data.packName}\nQuestion asked: "${data.question}"\nTheir answer: "${data.answer}"\n\nJudge it.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "fumble_feedback",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                score: { type: "integer", minimum: 0, maximum: 100 },
                verdict: { type: "string" },
                what_worked: { type: "string" },
                what_fumbled: { type: "string" },
                better_answer: { type: "string" },
              },
              required: ["score", "verdict", "what_worked", "what_fumbled", "better_answer"],
            },
          },
        },
      }),
    });

    if (res.status === 429) throw new Error("Rate limited — try again in a sec.");
    if (res.status === 402) throw new Error("Out of AI credits. Add more in Cloud settings.");
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");
    const parsed = JSON.parse(content);
    return FeedbackSchema.parse(parsed);
  });