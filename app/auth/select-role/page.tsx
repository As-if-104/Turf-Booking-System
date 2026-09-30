"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SelectRolePage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const createUser = useMutation(api.users.createUser);

  const handleRoleSelect = async (role: "user" | "owner") => {
    if (!user) return;

    setLoading(true);
    try {
      await createUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
        role: role,
        phoneNumber: user.phoneNumbers[0]?.phoneNumber,
      });

      // Redirect based on role
      if (role === "owner") {
        router.push("/owner-dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to TurfBook AI!</h1>
          <p className="text-lg text-muted-foreground">
            How would you like to use our platform?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-primary">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">I'm a Customer</CardTitle>
              <CardDescription className="text-base">
                Book turfs, get AI recommendations, and manage your bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Browse available turfs</li>
                <li>✓ Get AI-powered booking suggestions</li>
                <li>✓ View dynamic pricing</li>
                <li>✓ Manage your bookings</li>
              </ul>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleRoleSelect("user")}
                disabled={loading}
              >
                Continue as Customer
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-primary">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">I'm a Turf Owner</CardTitle>
              <CardDescription className="text-base">
                List your turfs, manage bookings, and track revenue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ List your sports turfs</li>
                <li>✓ Set pricing and availability</li>
                <li>✓ Manage bookings</li>
                <li>✓ Track revenue and analytics</li>
              </ul>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleRoleSelect("owner")}
                disabled={loading}
              >
                Continue as Turf Owner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
