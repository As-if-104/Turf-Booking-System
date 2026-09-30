import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("user"), v.literal("owner"), v.literal("admin")),
    phoneNumber: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  turfs: defineTable({
    name: v.string(),
    ownerId: v.string(),
    location: v.string(),
    sportType: v.union(
      v.literal("football"),
      v.literal("cricket"),
      v.literal("futsal"),
      v.literal("multi"),
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
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  timeSlots: defineTable({
    turfId: v.id("turfs"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    price: v.number(),
    basePrice: v.number(),
    demandMultiplier: v.number(),
    weatherMultiplier: v.number(),
    isBooked: v.boolean(),
    isRecommended: v.optional(v.boolean()),
    aiScore: v.optional(v.number()),
  })
    .index("by_turf", ["turfId"])
    .index("by_turf_and_date", ["turfId", "date"]),

  bookings: defineTable({
    userId: v.string(),
    turfId: v.id("turfs"),
    slotId: v.id("timeSlots"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    totalPrice: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("refund_pending"),
    ),
    paymentId: v.optional(v.string()),
    createdAt: v.number(),

    cancellationReason: v.optional(v.string()),
    cancellationDetails: v.optional(v.string()),
    refundRequested: v.optional(v.boolean()),
    refundStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("processed"),
      ),
    ),
    refundAmount: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    refundProcessedAt: v.optional(v.number()),
    stripeRefundId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_turf", ["turfId"])
    .index("by_status", ["status"])
    .index("by_refund_status", ["refundStatus"]),

  demandHistory: defineTable({
    turfId: v.id("turfs"),
    date: v.string(),
    hour: v.number(),
    bookingCount: v.number(),
    revenue: v.number(),
  }).index("by_turf_and_date", ["turfId", "date"]),

  weatherCache: defineTable({
    location: v.string(),
    date: v.string(),
    temperature: v.number(),
    condition: v.string(),
    precipitation: v.number(),
    windSpeed: v.number(),
    fetchedAt: v.number(),
  }).index("by_location_and_date", ["location", "date"]),
});
