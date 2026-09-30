import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Brain,
  TrendingDown,
  Calendar,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Recommendations",
    description:
      "Get intelligent time slot suggestions based on your preferences, weather, and demand patterns.",
  },
  {
    icon: TrendingDown,
    title: "Dynamic Pricing",
    description:
      "Enjoy fair pricing that adjusts based on demand, weather conditions, and peak hours.",
  },
  {
    icon: Calendar,
    title: "Real-Time Availability",
    description:
      "View up-to-date turf availability and book instantly without conflicts.",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description:
      "Complete your booking in seconds with our streamlined process and secure payment.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description:
      "Your transactions are protected with industry-standard security and encryption.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description:
      "Book slots that fit your schedule with easy rescheduling and cancellation options.",
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            Why Choose TurfBook AI?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the smartest way to book sports turf with features
            designed for modern players
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
