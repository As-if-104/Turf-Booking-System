export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: "user" | "owner" | "admin";
  phoneNumber?: string;
  createdAt: number;
}

export interface Turf {
  _id: string;
  name: string;
  ownerId: string;
  location: string;
  sportType: "football" | "cricket" | "futsal" | "multi";
  size: string;
  amenities: string[];
  basePrice: number;
  images: string[];
  description: string;
  operatingHours: {
    start: string;
    end: string;
  };
  isActive: boolean;
  createdAt: number;
}

export interface TimeSlot {
  _id: string;
  turfId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
//   basePr ice: number;
//   demandMultiplier: number;
//   weatherMultiplier: number;
//   isBooked: boolean;
//   isRecommended?: boolean;
//   aiScore?: number;
}

export interface Booking {
  _id: string;
  userId: string;
  turfId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  paymentId?: string;
  createdAt: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  precipitation: number;
  windSpeed: number;
}

export interface AIRecommendation {
  slotId: string;
  score: number;
  reasons: string[];
  predictedDemand: "low" | "medium" | "high";
  confidence: number;
}

export interface DemandPrediction {
  date: string;
  hour: number;
  predictedDemand: number;
  confidence: number;
}

export interface DynamicPricing {
  basePrice: number;
  demandMultiplier: number;
  weatherMultiplier: number;
  finalPrice: number;
  savingsPercentage?: number;
}