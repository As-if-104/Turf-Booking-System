import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateSlots = mutation({
  args: {
    turfId: v.id("turfs"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const turf = await ctx.db.get(args.turfId);
    if (!turf) throw new Error("Turf not found");

    const existingSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_turf_and_date", (q) =>
        q.eq("turfId", args.turfId).eq("date", args.date),
      )
      .collect();

    if (existingSlots.length > 0) {
      return { message: "Slots already exist for this date" };
    }

    const slots = [];
    const startHour = parseInt(turf.operatingHours.start.split(":")[0]);
    const endHour = parseInt(turf.operatingHours.end.split(":")[0]);

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endTime = `${String(hour + 1).padStart(2, "0")}:00`;

      await ctx.db.insert("timeSlots", {
        turfId: args.turfId,
        date: args.date,
        startTime,
        endTime,
        price: turf.basePrice,
        basePrice: turf.basePrice,
        demandMultiplier: 1.0,
        weatherMultiplier: 1.0,
        isBooked: false,
      });

      slots.push({ startTime, endTime });
    }

    return { message: "Slots generated successfully", count: slots.length };
  },
});

export const getAvailableSlots = query({
  args: {
    turfId: v.id("turfs"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("timeSlots")
      .withIndex("by_turf_and_date", (q) =>
        q.eq("turfId", args.turfId).eq("date", args.date),
      )
      .collect();
  },
});

export const updateSlotPrice = mutation({
  args: {
    slotId: v.id("timeSlots"),
    demandMultiplier: v.number(),
    weatherMultiplier: v.number(),
  },
  handler: async (ctx, args) => {
    const slot = await ctx.db.get(args.slotId);
    if (!slot) throw new Error("Slot not found");

    const newPrice =
      slot.basePrice * args.demandMultiplier * args.weatherMultiplier;

    await ctx.db.patch(args.slotId, {
      price: newPrice,
      demandMultiplier: args.demandMultiplier,
      weatherMultiplier: args.weatherMultiplier,
    });

    return { newPrice };
  },
});

export const markSlotAsBooked = mutation({
  args: {
    slotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.slotId, {
      isBooked: true,
    });
  },
});

export const releaseSlot = mutation({
  args: {
    slotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.slotId, {
      isBooked: false,
    });
  },
});

// ============================================
// NEW: DELETE & REGENERATE UTILITIES
// ============================================

// Delete slots for a specific turf and date
export const deleteSlotsByTurfAndDate = mutation({
  args: {
    turfId: v.id("turfs"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_turf_and_date", (q) =>
        q.eq("turfId", args.turfId).eq("date", args.date),
      )
      .collect();

    for (const slot of slots) {
      await ctx.db.delete(slot._id);
    }

    return {
      message: `Deleted ${slots.length} slots`,
      count: slots.length,
    };
  },
});

// Delete ALL slots for a specific turf (use with caution!)
export const deleteAllSlotsForTurf = mutation({
  args: {
    turfId: v.id("turfs"),
  },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_turf", (q) => q.eq("turfId", args.turfId))
      .collect();

    for (const slot of slots) {
      await ctx.db.delete(slot._id);
    }

    return {
      message: `Deleted ${slots.length} slots for this turf`,
      count: slots.length,
    };
  },
});

// Fix incorrect prices for existing slots
export const fixSlotPrices = mutation({
  args: {
    turfId: v.id("turfs"),
  },
  handler: async (ctx, args) => {
    const turf = await ctx.db.get(args.turfId);
    if (!turf) throw new Error("Turf not found");

    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_turf", (q) => q.eq("turfId", args.turfId))
      .collect();

    let updatedCount = 0;

    for (const slot of slots) {
      // Only update if price is wrong
      if (slot.price !== turf.basePrice || slot.basePrice !== turf.basePrice) {
        await ctx.db.patch(slot._id, {
          price: turf.basePrice,
          basePrice: turf.basePrice,
          demandMultiplier: 1.0,
          weatherMultiplier: 1.0,
        });
        updatedCount++;
      }
    }

    return {
      message: `Fixed ${updatedCount} slots with incorrect prices`,
      count: updatedCount,
      totalSlots: slots.length,
    };
  },
});

// Delete and regenerate slots for a specific date
export const resetSlotsForDate = mutation({
  args: {
    turfId: v.id("turfs"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const turf = await ctx.db.get(args.turfId);
    if (!turf) throw new Error("Turf not found");

    // First, delete existing slots
    const existingSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_turf_and_date", (q) =>
        q.eq("turfId", args.turfId).eq("date", args.date),
      )
      .collect();

    for (const slot of existingSlots) {
      await ctx.db.delete(slot._id);
    }

    // Then, generate new slots
    const startHour = parseInt(turf.operatingHours.start.split(":")[0]);
    const endHour = parseInt(turf.operatingHours.end.split(":")[0]);
    let generatedCount = 0;

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endTime = `${String(hour + 1).padStart(2, "0")}:00`;

      await ctx.db.insert("timeSlots", {
        turfId: args.turfId,
        date: args.date,
        startTime,
        endTime,
        price: turf.basePrice,
        basePrice: turf.basePrice,
        demandMultiplier: 1.0,
        weatherMultiplier: 1.0,
        isBooked: false,
      });

      generatedCount++;
    }

    return {
      message: "Slots reset successfully",
      deleted: existingSlots.length,
      generated: generatedCount,
    };
  },
});
