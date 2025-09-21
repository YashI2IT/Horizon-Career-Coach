"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const REQUIRED_FIELDS = [
  "salaryRanges",
  "growthRate",
  "demandLevel",
  "topSkills",
  "marketOutlook",
  "keyTrends",
  "recommendedSkills",
];

export const generateAIInsights = async (industry) => {
  const basePrompt = `
    Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format:
    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "High" | "Medium" | "Low",
      "topSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "marketOutlook": "Positive" | "Neutral" | "Negative",
      "keyTrends": ["trend1", "trend2", "trend3", "trend4", "trend5"],
      "recommendedSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"]
    }

    Rules:
    - Return ONLY valid JSON. No notes, explanations, markdown, or extra text.
    - Include at least 5 roles in "salaryRanges".
    - Growth rate must be a percentage (number only).
    - Include at least 5 items for topSkills, keyTrends, and recommendedSkills.
  `;

  const result = await model.generateContent(basePrompt);
  let text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) throw new Error("Gemini returned empty response");

  // Clean JSON fences if any
  text = text.replace(/```(?:json)?|```/g, "").trim();

  let insights;
  try {
    insights = JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse AI response:", text);
    throw new Error("AI returned invalid JSON");
  }

  // Validate & repair missing fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in insights)) {
      console.warn(` Missing field: ${field}, re-prompting Gemini...`);

      const repairPrompt = `
        The previous response for ${industry} industry was missing "${field}".
        Return ONLY valid JSON with ALL required fields: ${REQUIRED_FIELDS.join(
          ", "
        )}.
        Ensure "${field}" is included properly.
      `;

      const repairResult = await model.generateContent(repairPrompt);
      let repairText =
        repairResult.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      repairText = repairText.replace(/```(?:json)?|```/g, "").trim();

      try {
        insights = JSON.parse(repairText);
      } catch (err) {
        console.error("Repair response invalid JSON:", repairText);
        throw new Error("Gemini failed to repair missing fields");
      }
    }
  }

  // Convert enum values to match Prisma schema
  if (insights.demandLevel) {
    insights.demandLevel = insights.demandLevel.toUpperCase();
  }
  if (insights.marketOutlook) {
    insights.marketOutlook = insights.marketOutlook.toUpperCase();
  }

  return insights;
}

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  // Use user's industry property (make sure it exists on your user record)
  if (!user.industryInsight) {
    if (!user.industry)
      throw new Error("User industry is not defined, cannot generate insights");

    const insights = await generateAIInsights(user.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight;
  }

  return user.industryInsight;
}