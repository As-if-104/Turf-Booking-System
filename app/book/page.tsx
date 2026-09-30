"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { MapPin, Sparkles, Loader2, Info, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BookPage() {
  const router = useRouter();
  const [selectedTurf, setSelectedTurf] = useState<Id<"turfs"> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);

  const turfs = useQuery(api.turfs.getAllTurfs);
  const timeSlots = useQuery(
    api.timeSlots.getAvailableSlots,
    selectedTurf && selectedDate
      ? {
          turfId: selectedTurf,
          date: selectedDate.toISOString().split("T")[0],
        }
      : "skip",
  );

  const generateSlots = useMutation(api.timeSlots.generateSlots);

  const aiRecommendations = useQuery(
    api.ai.getRecommendations,
    selectedTurf && selectedDate
      ? {
          turfId: selectedTurf,
          date: selectedDate.toISOString().split("T")[0],
        }
      : "skip",
  );

  // Auto-generate slots if they don't exist
  useEffect(() => {
    const autoGenerateSlots = async () => {
      if (selectedTurf && selectedDate && timeSlots !== undefined) {
        if (timeSlots.length === 0 && !isGeneratingSlots) {
          setIsGeneratingSlots(true);
          try {
            await generateSlots({
              turfId: selectedTurf,
              date: selectedDate.toISOString().split("T")[0],
            });
          } catch (error) {
            console.error("Error generating slots:", error);
          } finally {
            setIsGeneratingSlots(false);
          }
        }
      }
    };

    autoGenerateSlots();
  }, [selectedTurf, selectedDate, timeSlots, generateSlots, isGeneratingSlots]);

  // Helper function to check if slots are consecutive
  const areConsecutive = (slots: string[]): boolean => {
    if (slots.length <= 1) return true;

    const sortedSlots = [...slots].sort((a, b) => {
      const slotA = timeSlots?.find((s) => s._id === a);
      const slotB = timeSlots?.find((s) => s._id === b);
      if (!slotA || !slotB) return 0;
      return slotA.startTime.localeCompare(slotB.startTime);
    });

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentSlot = timeSlots?.find((s) => s._id === sortedSlots[i]);
      const nextSlot = timeSlots?.find((s) => s._id === sortedSlots[i + 1]);

      if (!currentSlot || !nextSlot) return false;
      if (currentSlot.endTime !== nextSlot.startTime) return false;
    }

    return true;
  };

  // Handle slot selection
  const handleSlotSelection = (slotId: string) => {
    setSelectedSlots((prev) => {
      let newSelection: string[];

      if (prev.includes(slotId)) {
        // Deselect slot
        newSelection = prev.filter((id) => id !== slotId);
      } else {
        // Add slot
        if (prev.length >= 3) {
          alert("You can only select up to 3 consecutive slots");
          return prev;
        }
        newSelection = [...prev, slotId];
      }

      // Check if consecutive
      if (newSelection.length > 1 && !areConsecutive(newSelection)) {
        alert("Please select consecutive time slots only");
        return prev;
      }

      return newSelection;
    });
  };

  // Get selected turf details
  const selectedTurfDetails = turfs?.find((turf) => turf._id === selectedTurf);

  // Calculate total price
  const totalPrice = selectedSlots.reduce((sum, slotId) => {
    const slot = timeSlots?.find((s) => s._id === slotId);
    return sum + (slot?.price || 0);
  }, 0);

  // Get time range for selected slots
  const getTimeRange = () => {
    if (selectedSlots.length === 0) return null;

    const sortedSlots = [...selectedSlots].sort((a, b) => {
      const slotA = timeSlots?.find((s) => s._id === a);
      const slotB = timeSlots?.find((s) => s._id === b);
      if (!slotA || !slotB) return 0;
      return slotA.startTime.localeCompare(slotB.startTime);
    });

    const firstSlot = timeSlots?.find((s) => s._id === sortedSlots[0]);
    const lastSlot = timeSlots?.find(
      (s) => s._id === sortedSlots[sortedSlots.length - 1],
    );

    if (!firstSlot || !lastSlot) return null;

    return {
      start: firstSlot.startTime,
      end: lastSlot.endTime,
    };
  };

  const handleProceedToPayment = () => {
    if (selectedTurf && selectedSlots.length > 0 && selectedTurfDetails) {
      const timeRange = getTimeRange();
      if (!timeRange) return;

      const bookingData = {
        turfId: selectedTurf,
        turfName: selectedTurfDetails.name,
        slotIds: selectedSlots,
        date: selectedDate.toISOString().split("T")[0],
        startTime: timeRange.start,
        endTime: timeRange.end,
        totalPrice: totalPrice,
        duration: selectedSlots.length,
      };

      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
      router.push("/pricing");
    }
  };

  // Format time to 12-hour format with AM/PM
  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Book Your Turf</h1>
        <p className="text-muted-foreground">
          Select a turf, date, and time slot to book
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Turf</CardTitle>
              <CardDescription>
                Choose from available turfs in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!turfs || turfs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No turfs available
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {turfs.map((turf) => (
                    <Card
                      key={turf._id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTurf === turf._id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => {
                        setSelectedTurf(turf._id);
                        setSelectedSlots([]);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{turf.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            {turf.location}
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge>{turf.sportType}</Badge>
                            <span className="font-semibold">
                              {formatCurrency(turf.basePrice)}/hr
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTurf && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                  <CardDescription>Choose your preferred date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setSelectedSlots([]);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Time Slots</CardTitle>
                  <CardDescription>
                    Select up to 3 consecutive time slots
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You can select up to 3 consecutive slots. Selected:{" "}
                      {selectedSlots.length}/3
                    </AlertDescription>
                  </Alert>

                  {isGeneratingSlots ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Generating available slots...
                      </p>
                    </div>
                  ) : !timeSlots || timeSlots.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No slots available for this date
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot._id}
                          variant={
                            selectedSlots.includes(slot._id)
                              ? "default"
                              : "outline"
                          }
                          className="flex flex-col h-auto py-3"
                          onClick={() => handleSlotSelection(slot._id)}
                          disabled={slot.isBooked}
                        >
                          <span className="font-semibold text-sm">
                            {formatTime12Hour(slot.startTime)} -{" "}
                            {formatTime12Hour(slot.endTime)}
                          </span>
                          <span className="text-xs mt-1">
                            {formatCurrency(slot.price)}
                          </span>
                          {slot.isBooked && (
                            <span className="text-xs text-muted-foreground mt-1">
                              Booked
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-6">
          {selectedTurf &&
            aiRecommendations &&
            aiRecommendations.length > 0 && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Recommendations
                  </CardTitle>
                  <CardDescription>
                    Smart suggestions based on demand and weather
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiRecommendations.slice(0, 3).map((rec) => (
                    <div
                      key={rec.slotId}
                      className="p-3 bg-primary/5 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Slot Time</span>
                        <Badge variant="secondary">
                          Score: {rec.score.toFixed(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rec.reasons[0]}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            
          {selectedTurf &&
            aiRecommendations &&
            aiRecommendations.length > 0 && (
              <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    AI-Powered Recommendations
                  </CardTitle>
                  <CardDescription>
                    Smart suggestions based on energy levels, weather & demand
                    patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiRecommendations.slice(0, 3).map((rec, index) => {
                    // Add safety checks
                    if (!rec || !rec.aiInsights) return null;

                    return (
                      <div
                        key={rec.slotId}
                        className="p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-purple-100 dark:border-purple-900 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleSlotSelection(rec.slotId)}
                      >
                        {/* Rank Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <span className="text-2xl">🥇</span>
                            )}
                            {index === 1 && (
                              <span className="text-2xl">🥈</span>
                            )}
                            {index === 2 && (
                              <span className="text-2xl">🥉</span>
                            )}
                            <div>
                              <p className="font-semibold text-sm">
                                {formatTime12Hour(rec.startTime)} -{" "}
                                {formatTime12Hour(rec.endTime)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Slot {index + 1}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          >
                            AI Score: {rec.score || 0}
                          </Badge>
                        </div>

                        {/* AI Insights */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                              <div className="font-semibold text-blue-700 dark:text-blue-300">
                                {rec.aiInsights?.energyLevel || 0}%
                              </div>
                              <div className="text-muted-foreground">
                                Energy
                              </div>
                            </div>
                            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                              <div className="font-semibold text-green-700 dark:text-green-300">
                                {rec.aiInsights?.weatherScore || 0}%
                              </div>
                              <div className="text-muted-foreground">
                                Weather
                              </div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                              <div className="font-semibold text-orange-700 dark:text-orange-300">
                                {rec.aiInsights?.demandLevel || "N/A"}
                              </div>
                              <div className="text-muted-foreground">
                                Demand
                              </div>
                            </div>
                          </div>

                          {/* AI Reasons */}
                          {rec.reasons && rec.reasons.length > 0 && (
                            <div className="space-y-1">
                              {rec.reasons.map((reason, i) => (
                                <p
                                  key={i}
                                  className="text-xs text-muted-foreground flex items-start gap-1"
                                >
                                  <span className="text-purple-600 dark:text-purple-400 mt-0.5">
                                    •
                                  </span>
                                  {reason}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Optimal For Tags */}
                          {rec.aiInsights?.optimalFor &&
                            rec.aiInsights.optimalFor.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {rec.aiInsights.optimalFor
                                  .slice(0, 2)
                                  .map((activity) => (
                                    <Badge
                                      key={activity}
                                      variant="outline"
                                      className="text-xs border-purple-200 dark:border-purple-800"
                                    >
                                      {activity}
                                    </Badge>
                                  ))}
                              </div>
                            )}
                        </div>

                        {/* Quick Select Button */}
                        <Button
                          size="sm"
                          className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlotSelection(rec.slotId);
                          }}
                        >
                          {selectedSlots.includes(rec.slotId) ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Selected
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Select This Slot
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}

                  <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-center text-muted-foreground">
                      🤖 Powered by AI Analysis Engine
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedTurf && (
                <p className="text-sm text-muted-foreground">
                  Select a turf to continue
                </p>
              )}

              {selectedTurf && selectedSlots.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Select time slot(s) to continue
                </p>
              )}

              {selectedTurf && selectedSlots.length > 0 && getTimeRange() && (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Turf:</span>
                      <span className="font-medium">
                        {selectedTurfDetails?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {selectedDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">
                        {formatTime12Hour(getTimeRange()!.start)} -{" "}
                        {formatTime12Hour(getTimeRange()!.end)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {selectedSlots.length}{" "}
                        {selectedSlots.length === 1 ? "hour" : "hours"}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between text-base">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Payment
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
