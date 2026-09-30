import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTurf = mutation({
  args: {
    name: v.string(),
    ownerId: v.string(),
    location: v.string(),
    sportType: v.union(
      v.literal("football"),
      v.literal("cricket"),
      v.literal("futsal"),
      v.literal("multi")
    ),
    size: v.string(),
    amenities: v.array(v.string()),
    basePrice: v.number(),
    images: v.array(v.string()),
    description: v.string(),
    operatingHours: v.object({
      start: v.string(),
      end: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const turfId = await ctx.db.insert("turfs", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });

    return turfId;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
})

export const getAllTurfs = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("turfs")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getTurfById = query({
  args: { turfId: v.id("turfs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.turfId);
  },
});

export const getTurfsByOwner = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("turfs")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

export const updateTurf = mutation({
  args: {
    turfId: v.id("turfs"),
    name: v.string(),
    location: v.string(),
    sportType: v.union(
      v.literal("football"),
      v.literal("cricket"),
      v.literal("futsal"),
      v.literal("multi"),
    ),
    size: v.string(),
    basePrice: v.number(),
    description: v.string(),
    operatingHours: v.object({
      start: v.string(),
      end: v.string(),
    }),
    amenities: v.array(v.string()),
    isActive: v.boolean(),
    images: v.array(v.string()), // ADD THIS LINE
  },
  handler: async (ctx, args) => {
    const { turfId, ...updateData } = args;
    await ctx.db.patch(turfId, updateData);
    return turfId;
  },
});

export const deleteTurf = mutation({
  args: { turfId: v.id("turfs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.turfId, { isActive: false });
  },
});

