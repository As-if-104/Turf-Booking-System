import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createBooking = mutation({
  args: {
    userId: v.string(),
    turfId: v.id("turfs"),
    slotIds: v.array(v.id("timeSlots")),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    totalPrice: v.number(),
    paymentId: v.optional(v.string()), // ADD THIS
  },
  handler: async (ctx, args) => {
    // Check if all slots are still available
    for (const slotId of args.slotIds) {
      const slot = await ctx.db.get(slotId);
      if (!slot) {
        throw new Error(`Slot ${slotId} not found`);
      }
      if (slot.isBooked) {
        throw new Error("One or more slots have already been booked");
      }
    }

    // Create the booking
    const bookingId = await ctx.db.insert("bookings", {
      userId: args.userId,
      turfId: args.turfId,
      slotId: args.slotIds[0], // Primary slot ID for backward compatibility
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      totalPrice: args.totalPrice,
      status: "confirmed",
      paymentStatus: "paid",
      paymentId: args.paymentId, // ADD THIS
      createdAt: Date.now(),
    });

    // CRITICAL: Mark all slots as booked - THIS WAS MISSING!
    for (const slotId of args.slotIds) {
      await ctx.db.patch(slotId, {
        isBooked: true,
      });
    }

    return bookingId;
  },
});

export const getBookingsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Fetch related turf details for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const turf = await ctx.db.get(booking.turfId);
        return {
          ...booking,
          turfName: turf?.name || "Unknown Turf",
          turfLocation: turf?.location || "Unknown Location",
          turfSportType: turf?.sportType || "unknown",
        };
      }),
    );

    return bookingsWithDetails;
  },
});

export const getBookingById = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const turf = await ctx.db.get(booking.turfId);

    return {
      ...booking,
      turfName: turf?.name || "Unknown Turf",
      turfLocation: turf?.location || "Unknown Location",
      turfSportType: turf?.sportType || "unknown",
      turfAmenities: turf?.amenities || [],
    };
  },
});

export const cancelBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    slotIds: v.array(v.id("timeSlots")),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      throw new Error("Booking is already cancelled");
    }

    // Update booking status
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      paymentStatus: "refunded",
    });

    // Release all slots
    for (const slotId of args.slotIds) {
      await ctx.db.patch(slotId, {
        isBooked: false,
      });
    }

    return { success: true };
  },
});

export const getUpcomingBookings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), today),
          q.or(
            q.eq(q.field("status"), "confirmed"),
            q.eq(q.field("status"), "pending"),
          ),
        ),
      )
      .order("desc")
      .collect();

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const turf = await ctx.db.get(booking.turfId);
        return {
          ...booking,
          turfName: turf?.name || "Unknown Turf",
          turfLocation: turf?.location || "Unknown Location",
          turfSportType: turf?.sportType || "unknown",
        };
      }),
    );

    return bookingsWithDetails;
  },
});

export const getBookingsByTurf = query({
  args: {
    turfId: v.id("turfs"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let bookingsQuery = ctx.db
      .query("bookings")
      .withIndex("by_turf", (q) => q.eq("turfId", args.turfId));

    const bookings = await bookingsQuery.collect();

    // Filter by date if provided
    const filteredBookings = args.date
      ? bookings.filter((b) => b.date === args.date)
      : bookings;

    return filteredBookings;
  },
});

// Add to existing file

export const requestCancellationWithRefund = mutation({
  args: {
    bookingId: v.id("bookings"),
    slotIds: v.array(v.id("timeSlots")),
    cancellationReason: v.string(),
    cancellationDetails: v.string(),
    refundRequested: v.boolean(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "cancelled") {
      throw new Error("Booking is already cancelled");
    }

    // Validate cancellation details (minimum 20 characters)
    if (args.cancellationDetails.length < 20) {
      throw new Error(
        "Please provide a detailed reason (minimum 20 characters)",
      );
    }

    // Update booking with cancellation info
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      paymentStatus: args.refundRequested ? "refund_pending" : "refunded",
      cancellationReason: args.cancellationReason,
      cancellationDetails: args.cancellationDetails,
      refundRequested: args.refundRequested,
      refundStatus: args.refundRequested ? "pending" : undefined,
      refundAmount: args.refundRequested ? booking.totalPrice : undefined,
      cancelledAt: Date.now(),
    });

    // Release all slots
    for (const slotId of args.slotIds) {
      await ctx.db.patch(slotId, {
        isBooked: false,
      });
    }

    return { success: true };
  },
});

export const getAllBookingsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").order("desc").collect();

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const turf = await ctx.db.get(booking.turfId);
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.userId))
          .first();

        return {
          ...booking,
          turfName: turf?.name || "Unknown Turf",
          turfLocation: turf?.location || "Unknown Location",
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "Unknown Email",
        };
      }),
    );

    return bookingsWithDetails;
  },
});

export const getPendingRefunds = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_refund_status", (q) => q.eq("refundStatus", "pending"))
      .order("desc")
      .collect();

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const turf = await ctx.db.get(booking.turfId);
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.userId))
          .first();

        return {
          ...booking,
          turfName: turf?.name || "Unknown Turf",
          turfLocation: turf?.location || "Unknown Location",
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "Unknown Email",
        };
      }),
    );

    return bookingsWithDetails;
  },
});

export const approveRefund = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await ctx.db.patch(args.bookingId, {
      refundStatus: "approved",
    });

    return { success: true };
  },
});

export const rejectRefund = mutation({
  args: {
    bookingId: v.id("bookings"),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await ctx.db.patch(args.bookingId, {
      refundStatus: "rejected",
      paymentStatus: "paid", // Keep as paid since refund is rejected
    });

    return { success: true };
  },
});

export const markRefundProcessed = mutation({
  args: {
    bookingId: v.id("bookings"),
    stripeRefundId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      refundStatus: "processed",
      paymentStatus: "refunded",
      stripeRefundId: args.stripeRefundId,
      refundProcessedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getPendingRefundsByOwner = query({
  args: { turfIds: v.array(v.id("turfs")) },
  handler: async (ctx, args) => {
    if (args.turfIds.length === 0) {
      return [];
    }

    const bookings = await ctx.db.query("bookings").collect();

    const pendingRefunds = bookings.filter(
      (booking) =>
        args.turfIds.some((id) => id === booking.turfId) &&
        booking.status === "cancelled" &&
        booking.refundRequested === true &&
        (!booking.refundStatus || booking.refundStatus === "pending"),
    );

    const refundsWithDetails = await Promise.all(
      pendingRefunds.map(async (booking) => {
        const turf = await ctx.db.get(booking.turfId);
        // userId is a clerkId string, so query users by clerkId
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.userId))
          .first();

        return {
          ...booking,
          turfName: turf?.name || "Unknown Turf",
          turfLocation: turf?.location || "Unknown Location",
          turfSportType: turf?.sportType || "Unknown Sport",
          userName: user?.name || "Unknown User",
        };
      }),
    );

    return refundsWithDetails;
  },
});

