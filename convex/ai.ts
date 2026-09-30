// convex/ai.ts
// Create this new file in your convex folder

import { v } from "convex/values";
import { query } from "./_generated/server";

interface SlotRecommendation {
  slotId: string;
  startTime: string;
  endTime: string;
  score: number;
  reasons: string[];
  aiInsights: {
    energyLevel: number;
    weatherScore: number;
    demandLevel: string;
    optimalFor: string[];
  };
}

export const getRecommendations = query({
  args: {
    turfId: v.id("turfs"),
    date: v.string(),
  },
  handler: async (ctx, args): Promise<SlotRecommendation[]> => {
    // Get all available slots for the date
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_turf_and_date", (q) =>
        q.eq("turfId", args.turfId).eq("date", args.date),
      )
      .filter((q) => q.eq(q.field("isBooked"), false))
      .collect();

    if (slots.length === 0) return [];

    // Get all bookings for this turf to analyze patterns
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_turf", (q) => q.eq("turfId", args.turfId))
      .collect();

    const recommendations: SlotRecommendation[] = [];

    for (const slot of slots) {
      const hour = parseInt(slot.startTime.split(":")[0]);

      // AI ANALYSIS #1: Energy Level Based on Time
      const energyLevel = calculateEnergyLevel(hour);

      // AI ANALYSIS #2: Weather Score (simulated)
      const weatherScore = getWeatherScore(hour, args.date);

      // AI ANALYSIS #3: Demand Analysis
      const demandLevel = analyzeDemand(slot.startTime, allBookings);

      // AI ANALYSIS #4: Optimal Activity Type
      const optimalFor = determineOptimalActivity(hour, weatherScore);

      // Calculate overall AI score
      const score = calculateAIScore(energyLevel, weatherScore, demandLevel);

      // Generate AI reasons
      const reasons = generateReasons(
        energyLevel,
        weatherScore,
        demandLevel,
        hour,
      );

      recommendations.push({
        slotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        score,
        reasons,
        aiInsights: {
          energyLevel,
          weatherScore,
          demandLevel,
          optimalFor,
        },
      });
    }

    // Sort by AI score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  },
});

// AI ALGORITHM #1: Energy Level Calculation
function calculateEnergyLevel(hour: number): number {
  // Based on circadian rhythm research
  if (hour >= 6 && hour < 9) return 75; // Morning fresh
  if (hour >= 9 && hour < 12) return 90; // Peak performance
  if (hour >= 12 && hour < 14) return 60; // Post-lunch dip
  if (hour >= 14 && hour < 17) return 85; // Afternoon peak
  if (hour >= 17 && hour < 20) return 80; // Evening energy
  if (hour >= 20 && hour < 22) return 65; // Winding down
  return 50; // Late night
}

// AI ALGORITHM #2: Weather Score (Simulated AI)
function getWeatherScore(hour: number, date: string): number {
  // In production, you'd call a real weather API
  // For demo, we simulate realistic weather patterns
  const dayOfYear = new Date(date).getDate();
  const baseScore = 70 + Math.sin(dayOfYear / 10) * 20;

  // Adjust for time of day
  if (hour >= 11 && hour <= 15) {
    return Math.max(50, baseScore - 15); // Hot midday
  }
  if (hour >= 6 && hour <= 9) {
    return Math.min(95, baseScore + 10); // Pleasant morning
  }
  if (hour >= 17 && hour <= 19) {
    return Math.min(95, baseScore + 15); // Perfect evening
  }

  return baseScore;
}

// AI ALGORITHM #3: Demand Analysis
function analyzeDemand(
  slotTime: string,
  bookings: any[],
): "Low" | "Medium" | "High" {
  const hour = parseInt(slotTime.split(":")[0]);

  // Count historical bookings at this time
  const sameTimeBookings = bookings.filter((b) => {
    const bookingHour = parseInt(b.startTime.split(":")[0]);
    return Math.abs(bookingHour - hour) <= 1;
  });

  const demandCount = sameTimeBookings.length;

  if (demandCount < 5) return "Low";
  if (demandCount < 15) return "Medium";
  return "High";
}

// AI ALGORITHM #4: Activity Optimization
function determineOptimalActivity(
  hour: number,
  weatherScore: number,
): string[] {
  const activities: string[] = [];

  if (hour >= 6 && hour < 10) {
    activities.push("Morning Jog", "Yoga", "Light Training");
  } else if (hour >= 10 && hour < 14) {
    activities.push("Competitive Matches", "Team Practice", "Tournaments");
  } else if (hour >= 14 && hour < 17) {
    activities.push("Training Sessions", "Skill Development");
  } else if (hour >= 17 && hour < 21) {
    activities.push("Evening Games", "Friendly Matches", "Recreation");
  } else {
    activities.push("Night Games", "Casual Play");
  }

  if (weatherScore > 80) {
    activities.push("Outdoor Activities");
  }

  return activities;
}

// AI SCORING: Combine all factors
function calculateAIScore(
  energyLevel: number,
  weatherScore: number,
  demandLevel: string,
): number {
  let score = 0;

  // Energy contributes 40%
  score += energyLevel * 0.4;

  // Weather contributes 35%
  score += weatherScore * 0.35;

  // Demand contributes 25% (inverse - lower demand = higher score)
  const demandScore =
    demandLevel === "Low" ? 100 : demandLevel === "Medium" ? 60 : 30;
  score += demandScore * 0.25;

  return Math.round(score);
}

// AI INSIGHTS: Generate human-readable reasons
function generateReasons(
  energyLevel: number,
  weatherScore: number,
  demandLevel: string,
  hour: number,
): string[] {
  const reasons: string[] = [];

  // Energy-based reasons
  if (energyLevel >= 85) {
    reasons.push("⚡ Peak energy time - optimal for intense activities");
  } else if (energyLevel >= 70) {
    reasons.push("💪 Good energy levels for active play");
  } else if (energyLevel >= 60) {
    reasons.push("🌙 Moderate energy - great for casual games");
  }

  // Weather-based reasons
  if (weatherScore >= 85) {
    reasons.push("🌤️ Excellent weather conditions expected");
  } else if (weatherScore >= 70) {
    reasons.push("☀️ Pleasant weather for outdoor play");
  } else if (weatherScore < 60) {
    reasons.push("🌡️ Consider indoor alternatives if available");
  }

  // Demand-based reasons
  if (demandLevel === "Low") {
    reasons.push("📊 Low demand - better availability & flexibility");
  } else if (demandLevel === "Medium") {
    reasons.push("👥 Moderate demand - book soon to secure slot");
  } else {
    reasons.push("🔥 High demand - popular time slot");
  }

  // Time-specific insights
  if (hour >= 6 && hour < 9) {
    reasons.push("🌅 Perfect for morning routines");
  } else if (hour >= 17 && hour < 20) {
    reasons.push("🌆 Ideal after-work timing");
  }

  return reasons.slice(0, 3); // Return top 3 reasons
}
