"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Join TurfBook AI</h1>
          <p className="text-muted-foreground">
            Sign up to book turfs or list your own
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
          routing="path"
          path="/auth/sign-up"
          unsafeMetadata={{
            role: "user",
          }}
        />
      </div>
    </div>
  );
}
