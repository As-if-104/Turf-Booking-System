"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams?.get("session_id");

    if (sessionId) {
      // Clear pending booking from localStorage
      localStorage.removeItem("pendingBooking");
      setIsLoading(false);
    } else {
      router.push("/book");
    }
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your turf booking has been confirmed. You will receive a
              confirmation email shortly.
            </p>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              View My Bookings
            </Button>
            <Button onClick={() => router.push("/book")}>
              Book Another Turf
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
