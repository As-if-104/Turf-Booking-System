import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Calendar,
  CreditCard,
  Brain,
  TrendingDown,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: "Browse Turfs",
      description:
        "Explore available turfs in your area with detailed information about facilities, sports types, and amenities.",
    },
    {
      icon: Calendar,
      title: "Select Date & Time",
      description:
        "Choose your preferred date and view real-time availability. Our system shows all open slots instantly.",
    },
    {
      icon: Brain,
      title: "Get AI Recommendations",
      description:
        "Our AI analyzes demand patterns, weather conditions, and your preferences to suggest optimal booking times.",
    },
    {
      icon: CreditCard,
      title: "Book & Pay",
      description:
        "Complete your booking with secure payment processing. Get instant confirmation and booking details.",
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Recommendations",
      description:
        "Machine learning algorithms analyze historical booking data, weather forecasts, and demand patterns to suggest the best time slots for you. Save money by booking during predicted off-peak hours.",
      color: "text-purple-500",
    },
    {
      icon: TrendingDown,
      title: "Dynamic Pricing",
      description:
        "Experience fair, transparent pricing that adjusts based on real-time demand and weather conditions. Higher demand during peak hours? You'll know upfront. Good weather on a weekday? Enjoy lower rates.",
      color: "text-blue-500",
    },
    {
      icon: Zap,
      title: "Instant Booking",
      description:
        "No more phone calls or waiting for confirmations. Book your turf in seconds with our streamlined process. Real-time availability ensures no booking conflicts.",
      color: "text-green-500",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          How TurfBook AI Works
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the smartest way to book sports turf with AI-powered
          recommendations and transparent pricing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={index} className="relative">
              <CardContent className="pt-12 pb-6 text-center">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {index + 1}
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Intelligent Features
        </h2>
        <div className="space-y-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div
                      className={`w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-12 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Join thousands of players who book smarter with TurfBook AI
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/book">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Book Now
            </Button>
          </Link>
          <Link href="/pricing">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10"
            >
              View Pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
