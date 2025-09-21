"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { checkUser } from "@/lib/checkUser";


export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Ensure user exists in database, create if not
  const user = await checkUser();

  if (!user) throw new Error("Failed to create or find user");

  try {
    // First check if industry exists outside of transaction
    let industryInsight = await db.industryInsight.findUnique({
      where: {
        industry: data.industry,
      },
    });

    // If industry doesn't exist, generate insights outside transaction
    if (!industryInsight) {
      const insights = await generateAIInsights(data.industry);

      // Create industry insight outside transaction to avoid timeout
      industryInsight = await db.industryInsight.create({
        data: {
          industry: data.industry,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Now update the user in a simple operation
    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
        skills: data.skills,
      },
    });

    const result = { updatedUser, industryInsight };

    revalidatePath("/");
    return { success: true, ...result }
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile" + error.message);
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    // Ensure user exists in database, create if not
    const user = await checkUser();

    if (!user) {
      return { isOnboarded: false };
    }

    // Check if user has completed onboarding
    return {
      isOnboarded: !!user.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error.message);
    throw new Error("Failed to check onboarding status");
  }
}