"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { getStripe } from "@/lib/stripe-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  TrendingDown,
  TrendingUp,
  Loader2,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface BookingData {
  turfId: string;
  turfName: string;
  slotIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  duration: number;
}

export default function PricingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createBooking = useMutation(api.bookings.createBooking);
  const markSlotAsBooked = useMutation(api.timeSlots.markSlotAsBooked);

  // Fetch turf details
  const turfDetails = useQuery(
    api.turfs.getTurfById,
    bookingData ? { turfId: bookingData.turfId as Id<"turfs"> } : "skip",
  );

  useEffect(() => {
    const storedBooking = localStorage.getItem("pendingBooking");
    if (storedBooking) {
      setBookingData(JSON.parse(storedBooking));
    } else {
      router.push("/book");
    }
  }, [router]);

  // Format time to 12-hour format
  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleConfirmBooking = async () => {
    if (!bookingData || !user || !turfDetails) return;

    setIsProcessing(true);
    try {
      // Create Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingData: {
            turfId: bookingData.turfId,
            turfName: turfDetails.name,
            slotIds: bookingData.slotIds,
            date: bookingData.date,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            totalPrice: bookingData.totalPrice,
          },
        }),
      });

      const { url, error } = await response.json(); // Changed: sessionId -> url

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      if (url) {
        // Changed: removed stripe initialization, just check if url exists
        window.location.href = url; // Changed: sessionId.url -> url
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      alert(error.message || "Failed to create checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!bookingData || !turfDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const basePrice = turfDetails.basePrice * bookingData.duration;
  const discount = basePrice - bookingData.totalPrice;
  const hasDiscount = discount > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push("/book")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Booking
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Review & Confirm
        </h1>
        <p className="text-muted-foreground">
          Review your booking details and proceed to payment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>
                Confirm your turf booking information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Turf Name</p>
                    <p className="font-semibold text-lg">{turfDetails.name}</p>
                  </div>
                  <Badge>{turfDetails.sportType}</Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      Location
                    </div>
                    <p className="font-medium">{turfDetails.location}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      Date
                    </div>
                    <p className="font-medium">
                      {new Date(bookingData.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      Time
                    </div>
                    <p className="font-medium">
                      {formatTime12Hour(bookingData.startTime)} -{" "}
                      {formatTime12Hour(bookingData.endTime)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {bookingData.duration}{" "}
                      {bookingData.duration === 1 ? "Hour" : "Hours"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {turfDetails.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          {hasDiscount && (
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  You're Saving Money!
                </CardTitle>
                <CardDescription>
                  Dynamic pricing has reduced your total cost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Regular Price
                  </span>
                  <span className="font-medium line-through text-muted-foreground">
                    {formatCurrency(basePrice)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Your Discount
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  >
                    -{formatCurrency(discount)}
                  </Badge>
                </div>

                <Separator />

                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    Final Price
                  </span>
                  <span className="font-bold text-xl text-green-700 dark:text-green-300">
                    {formatCurrency(bookingData.totalPrice)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Summary Card */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Base Price ({bookingData.duration}h)
                  </span>
                  <span>{formatCurrency(basePrice)}</span>
                </div>

                {hasDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (0%)</span>
                  <span>{formatCurrency(0)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(bookingData.totalPrice)}
                  </span>
                </div>

                {hasDiscount && (
                  <div className="text-center text-sm text-green-600 dark:text-green-400">
                    You saved {formatCurrency(discount)} with dynamic pricing!
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirmBooking}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirm & Pay
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By confirming, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
