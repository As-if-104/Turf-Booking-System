"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Add cancellation form state
  const [cancellationForm, setCancellationForm] = useState({
    reason: "",
    details: "",
    refundRequested: true,
  });

  // Check if user exists in database
  const existingUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip",
  );

  // UPDATED: Use getBookingsByUser instead of getUpcomingBookings for debugging
  const allBookings = useQuery(
    api.bookings.getBookingsByUser,
    user?.id ? { userId: user.id } : "skip",
  );

  // Filter upcoming bookings on the client side
  const bookings = allBookings?.filter((booking) => {
    const today = new Date().toISOString().split("T")[0];
    const isUpcoming = booking.date >= today;
    const isNotCancelled =
      booking.status === "confirmed" || booking.status === "pending";
    return isUpcoming && isNotCancelled;
  });

  // Update to use the new mutation
  const cancelBookingWithRefund = useMutation(
    api.bookings.requestCancellationWithRefund,
  );

  // DEBUGGING: Log everything
  useEffect(() => {
    console.log("=== DASHBOARD DEBUG ===");
    console.log("User ID:", user?.id);
    console.log("Is Loaded:", isLoaded);
    console.log("Existing User:", existingUser);
    console.log("All Bookings:", allBookings);
    console.log("Filtered Bookings:", bookings);
    console.log("Today's Date:", new Date().toISOString().split("T")[0]);
    console.log("======================");
  }, [user, isLoaded, existingUser, allBookings, bookings]);

  // Role checking and redirection
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;

    // If user doesn't exist in DB, redirect to role selection
    if (existingUser === null) {
      router.push("/auth/select-role");
      return;
    }

    // If user exists but is an owner, redirect to owner dashboard
    if (existingUser && existingUser.role === "owner") {
      router.push("/owner-dashboard");
      return;
    }

    // If user exists but is an admin, redirect to admin
    if (existingUser && existingUser.role === "admin") {
      router.push("/admin");
      return;
    }
  }, [user, existingUser, isLoaded, router]);

  // Show loading while checking
  if (!isLoaded || existingUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user record found or wrong role, don't render
  if (!existingUser || existingUser.role !== "user") {
    return null;
  }

  // Show success message if redirected from booking
  const newBookingId = searchParams?.get("booking");

  // Format time to 12-hour format
  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleViewDetails = (booking: any) => {
    setIsLoadingDetails(true);
    setSelectedBooking(booking);

    // Small delay for smooth transition
    setTimeout(() => {
      setShowDetailsDialog(true);
      setIsLoadingDetails(false);
    }, 150);
  };

  // Updated handleCancelClick
  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setCancellationForm({
      reason: "",
      details: "",
      refundRequested: true,
    });
    setShowCancelDialog(true);
  };

  // Updated handleConfirmCancel
  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    // Validate form
    if (!cancellationForm.reason) {
      alert("Please select a cancellation reason");
      return;
    }

    if (cancellationForm.details.length < 20) {
      alert("Please provide a detailed explanation (minimum 20 characters)");
      return;
    }

    setIsCancelling(true);
    try {
      // Get all slot IDs for this booking
      const slots = await fetch(
        `/api/bookings/${selectedBooking._id}/slots`,
      ).then((res) =>
        res.json().catch(() => ({ slotIds: [selectedBooking.slotId] })),
      );

      await cancelBookingWithRefund({
        bookingId: selectedBooking._id,
        slotIds: slots.slotIds || [selectedBooking.slotId],
        cancellationReason: cancellationForm.reason,
        cancellationDetails: cancellationForm.details,
        refundRequested: cancellationForm.refundRequested,
      });

      alert(
        cancellationForm.refundRequested
          ? "Booking cancelled. Your refund request has been submitted for review."
          : "Booking cancelled successfully.",
      );

      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancellationForm({ reason: "", details: "", refundRequested: true });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Upcoming Bookings
          </h1>
          <p className="text-muted-foreground">Manage your turf bookings</p>
        </div>
        <Button onClick={() => router.push("/book")}>Book New Turf</Button>
      </div>

      {/* DEBUG INFO - REMOVE AFTER FIXING */}
      {/* {process.env.NODE_ENV === "development" && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <p className="text-sm font-mono">
              <strong>Debug Info:</strong>
              <br />
              User ID: {user?.id}
              <br />
              Total Bookings: {allBookings?.length || 0}
              <br />
              Filtered Bookings: {bookings?.length || 0}
              <br />
              Today: {new Date().toISOString().split("T")[0]}
            </p>
          </CardContent>
        </Card>
      )} */}

      {/* Booking Statistics */}
      {bookings && bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bookings.filter((b) => b.status === "confirmed").length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {bookings.filter((b) => b.status === "pending").length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {newBookingId && (
        <Card className="mb-6 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                Booking Confirmed!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your turf has been successfully booked.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!bookings ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Calendar className="w-16 h-16 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">No Upcoming Bookings</p>
              <p className="text-muted-foreground mb-4">
                You don't have any upcoming bookings yet.
              </p>
              <Button onClick={() => router.push("/book")}>
                Book Your First Turf
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card
              key={booking._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          Booking #{booking._id.slice(-6)}
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{booking.status}</span>
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {booking.turfName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {new Date(booking.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {formatTime12Hour(booking.startTime)} -{" "}
                          {formatTime12Hour(booking.endTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {formatCurrency(booking.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(booking)}
                      disabled={isLoadingDetails}
                    >
                      {isLoadingDetails ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "View Details"
                      )}
                    </Button>
                    {booking.status !== "cancelled" && (
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelClick(booking)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about your booking
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-semibold">
                    #{selectedBooking._id.slice(-8)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {getStatusIcon(selectedBooking.status)}
                    <span className="ml-1">{selectedBooking.status}</span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Turf Information
                </p>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-semibold text-lg">
                    {selectedBooking.turfName}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {selectedBooking.turfLocation}
                  </div>
                  <Badge>{selectedBooking.turfSportType}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selectedBooking.date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {formatTime12Hour(selectedBooking.startTime)} -{" "}
                    {formatTime12Hour(selectedBooking.endTime)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Payment Information
                </p>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(selectedBooking.totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Status</span>
                    <Badge
                      variant={
                        selectedBooking.paymentStatus === "paid"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedBooking.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancellation. If you request a refund,
              it will be reviewed by our team.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 py-4">
              {/* Booking Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-semibold">{selectedBooking.turfName}</p>
                <p className="text-sm">
                  {new Date(selectedBooking.date).toLocaleDateString()} at{" "}
                  {formatTime12Hour(selectedBooking.startTime)}
                </p>
                <p className="text-sm font-semibold">
                  Amount: {formatCurrency(selectedBooking.totalPrice)}
                </p>
              </div>

              {/* Cancellation Reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={cancellationForm.reason}
                  onChange={(e) =>
                    setCancellationForm({
                      ...cancellationForm,
                      reason: e.target.value,
                    })
                  }
                >
                  <option value="">Select a reason</option>
                  <option value="Personal Emergency">Personal Emergency</option>
                  <option value="Weather Conditions">Weather Conditions</option>
                  <option value="Schedule Conflict">Schedule Conflict</option>
                  <option value="Found Better Option">
                    Found Better Option
                  </option>
                  <option value="Medical Reasons">Medical Reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Detailed Explanation */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Detailed Explanation <span className="text-red-500">*</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (Minimum 20 characters)
                  </span>
                </label>
                <textarea
                  className="w-full p-2 border rounded-md min-h-[100px] bg-background"
                  placeholder="Please provide a clear and detailed explanation for your cancellation..."
                  value={cancellationForm.details}
                  onChange={(e) =>
                    setCancellationForm({
                      ...cancellationForm,
                      details: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {cancellationForm.details.length} / 20 characters
                </p>
              </div>

              {/* Refund Request */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <input
                  type="checkbox"
                  id="refundRequested"
                  className="mt-1"
                  checked={cancellationForm.refundRequested}
                  onChange={(e) =>
                    setCancellationForm({
                      ...cancellationForm,
                      refundRequested: e.target.checked,
                    })
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="refundRequested"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Request a refund
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cancellationForm.refundRequested
                      ? "Your refund request will be reviewed by our team. Refunds are typically processed within 5-7 business days after approval."
                      : "You will not receive a refund for this cancellation."}
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>The slot will be released immediately</li>
                      <li>This action cannot be undone</li>
                      {cancellationForm.refundRequested && (
                        <li>Refund approval depends on the reason provided</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancellationForm({
                  reason: "",
                  details: "",
                  refundRequested: true,
                });
              }}
              disabled={isCancelling}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={
                isCancelling ||
                !cancellationForm.reason ||
                cancellationForm.details.length < 20
              }
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
