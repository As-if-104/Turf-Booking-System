"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function OwnerDashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSection, setActiveSection] = useState<"turfs" | "refunds">(
    "turfs",
  );

  // Check if user exists in database
  const existingUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip",
  );

  const turfs = useQuery(
    api.turfs.getTurfsByOwner,
    user?.id ? { ownerId: user.id } : "skip",
  );

  const turfIds = turfs?.map((t) => t._id) || [];

  const pendingRefunds = useQuery(
    api.bookings.getPendingRefundsByOwner,
    turfIds.length > 0 ? { turfIds } : "skip",
  );

  const approveRefund = useMutation(api.bookings.approveRefund);
  const rejectRefund = useMutation(api.bookings.rejectRefund);

  // Role checking and redirection
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;

    if (existingUser === null) {
      router.push("/auth/select-role");
      return;
    }

    if (existingUser && existingUser.role === "user") {
      router.push("/dashboard");
      return;
    }

    if (existingUser && existingUser.role === "admin") {
      router.push("/admin");
      return;
    }
  }, [user, existingUser, isLoaded, router]);

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

  if (!existingUser || existingUser.role !== "owner") {
    return null;
  }

  const totalRevenue = 1250.5;
  const totalBookings = 48;
  const activeTurfs = turfs?.filter((t) => t.isActive).length || 0;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleApproveRefund = async (booking: any) => {
    setIsProcessing(true);
    try {
      await approveRefund({ bookingId: booking._id });

      const response = await fetch("/api/process-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          paymentIntentId: booking.paymentId,
          amount: booking.refundAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Refund approved and processed successfully!");
      } else {
        alert(
          "Refund approved but payment processing failed. Please check Stripe.",
        );
      }

      setShowRefundDialog(false);
      setSelectedRefund(null);
    } catch (error) {
      console.error("Error approving refund:", error);
      alert("Failed to approve refund");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRefund = async (booking: any) => {
    setIsProcessing(true);
    try {
      await rejectRefund({ bookingId: booking._id });
      alert("Refund rejected successfully");
      setShowRefundDialog(false);
      setSelectedRefund(null);
    } catch (error) {
      console.error("Error rejecting refund:", error);
      alert("Failed to reject refund");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your turfs and track performance
          </p>
        </div>
        <Link href="/owner-dashboard/add-turf">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Turf
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Total bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Turfs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeTurfs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pending Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingRefunds?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Needs review</p>
          </CardContent>
        </Card>
      </div>

      {/* Simple Toggle Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeSection === "turfs" ? "default" : "outline"}
          onClick={() => setActiveSection("turfs")}
        >
          Your Turfs
        </Button>
        <Button
          variant={activeSection === "refunds" ? "default" : "outline"}
          onClick={() => setActiveSection("refunds")}
        >
          Refund Requests
          {pendingRefunds && pendingRefunds.length > 0 && (
            <Badge className="ml-2 bg-yellow-600">
              {pendingRefunds.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Turfs Section */}
      {activeSection === "turfs" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Turfs</h2>
          {!turfs || turfs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No turfs added yet</p>
                <Link href="/owner-dashboard/add-turf">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Turf
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {turfs.map((turf) => (
                <Card
                  key={turf._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{turf.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          turf.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <p>📍 {turf.location}</p>
                      <p>⚽ {turf.sportType}</p>
                      <p>💰 {formatCurrency(turf.basePrice)}/hour</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          router.push(`/owner-dashboard/edit-turf/${turf._id}`)
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          router.push(`/owner-dashboard/turf/${turf._id}`)
                        }
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Refunds Section */}
      {activeSection === "refunds" && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Refund Requests</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review cancellation requests for your turfs
            </p>
          </CardHeader>
          <CardContent>
            {!pendingRefunds ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : pendingRefunds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending refund requests
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRefunds.map((booking: any) => (
                  <Card
                    key={booking._id}
                    className="border-l-4 border-l-yellow-500"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {booking.turfName}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              #{booking._id.slice(-6)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">User</p>
                              <p className="font-medium">{booking.userName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="font-medium">
                                {new Date(booking.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Time</p>
                              <p className="font-medium">
                                {formatTime(booking.startTime)} -{" "}
                                {formatTime(booking.endTime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Amount</p>
                              <p className="font-bold text-lg">
                                {formatCurrency(booking.refundAmount || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <p className="text-sm text-muted-foreground">
                              Reason
                            </p>
                            <Badge className="mt-1">
                              {booking.cancellationReason}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(booking);
                              setShowRefundDialog(true);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Refund Request Details</DialogTitle>
            <DialogDescription>
              Review the cancellation details and decide whether to approve or
              reject
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono">#{selectedRefund._id.slice(-8)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refund Amount</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(selectedRefund.refundAmount || 0)}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-semibold">{selectedRefund.turfName}</p>
                <p className="text-sm">
                  {new Date(selectedRefund.date).toLocaleDateString()} at{" "}
                  {formatTime(selectedRefund.startTime)} -{" "}
                  {formatTime(selectedRefund.endTime)}
                </p>
                <p className="text-sm">Customer: {selectedRefund.userName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Cancellation Reason
                </p>
                <Badge>{selectedRefund.cancellationReason}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Detailed Explanation
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    {selectedRefund.cancellationDetails}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled At</p>
                  <p className="text-sm">
                    {selectedRefund.cancelledAt
                      ? new Date(selectedRefund.cancelledAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={isProcessing}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRejectRefund(selectedRefund)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Refund
                </>
              )}
            </Button>
            <Button
              onClick={() => handleApproveRefund(selectedRefund)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve & Process Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
