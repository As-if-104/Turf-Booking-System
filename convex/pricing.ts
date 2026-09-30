import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const calculateDynamicPrice = query({
  args: {
    turfId: v.id("turfs"),
    date: v.string(),
    startTime: v.string(),
  },
  handler: async (ctx, args) => {
    const turf = await ctx.db.get(args.turfId);
    if (!turf) throw new Error("Turf not found");

    const basePrice = turf.basePrice;
    const hour = parseInt(args.startTime.split(":")[0]);
    const dayOfWeek = new Date(args.date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let demandMultiplier = 1.0;

    if (hour >= 6 && hour < 9) {
      demandMultiplier = 0.8;
    } else if (hour >= 9 && hour < 12) {
      demandMultiplier = 0.9;
    } else if (hour >= 12 && hour < 15) {
      demandMultiplier = 0.85;
    } else if (hour >= 15 && hour < 18) {
      demandMultiplier = 1.0;
    } else if (hour >= 18 && hour < 21) {
      demandMultiplier = 1.3;
    } else {
      demandMultiplier = 1.1;
    }

    if (isWeekend) {
      demandMultiplier *= 1.15;
    }

    const bookingsToday = await ctx.db
      .query("timeSlots")
      .withIndex("by_turf_and_date", (q) =>
        q.eq("turfId", args.turfId).eq("date", args.date)
      )
      .filter((q) => q.eq(q.field("isBooked"), true))
      .collect();

    const bookedPercentage = bookingsToday.length / 16;
    if (bookedPercentage > 0.7) {
      demandMultiplier *= 1.2;
    } else if (bookedPercentage < 0.3) {
      demandMultiplier *= 0.9;
    }

    let weatherMultiplier = 1.0;

    const finalPrice = basePrice * demandMultiplier * weatherMultiplier;
    const savingsPercentage = ((basePrice - finalPrice) / basePrice) * 100;

    return {
      basePrice,
      demandMultiplier: Math.round(demandMultiplier * 100) / 100,
      weatherMultiplier,
      finalPrice: Math.round(finalPrice * 100) / 100,
      savingsPercentage: Math.round(savingsPercentage),
    };
  },
});

export const updateAllSlotPrices = mutation({
  args: {
    turfId: v.id("turfs"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_turf_and_date", (q) =>
        q.eq("turfId", args.turfId).eq("date", args.date)
      )
      .collect();

    for (const slot of slots) {
      const hour = parseInt(slot.startTime.split(":")[0]);
      const dayOfWeek = new Date(args.date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let demandMultiplier = 1.0;

      if (hour >= 6 && hour < 9) demandMultiplier = 0.8;
      else if (hour >= 9 && hour < 12) demandMultiplier = 0.9;
      else if (hour >= 12 && hour < 15) demandMultiplier = 0.85;
      else if (hour >= 15 && hour < 18) demandMultiplier = 1.0;
      else if (hour >= 18 && hour < 21) demandMultiplier = 1.3;
      else demandMultiplier = 1.1;

      if (isWeekend) demandMultiplier *= 1.15;

      const weatherMultiplier = 1.0;
      const newPrice = slot.basePrice * demandMultiplier * weatherMultiplier;

      await ctx.db.patch(slot._id, {
        price: Math.round(newPrice * 100) / 100,
        demandMultiplier: Math.round(demandMultiplier * 100) / 100,
        weatherMultiplier,
      });
    }

    return { message: "Prices updated successfully" };
  },
});

export const getPriceHistory = query({
  args: {
    turfId: v.id("turfs"),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("demandHistory")
      .withIndex("by_turf_and_date", (q) => q.eq("turfId", args.turfId))
      .order("desc")
      .take(30);

    return history;
  },
});
