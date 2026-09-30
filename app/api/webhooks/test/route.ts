// Create this file: app/api/webhooks/test/route.ts
// This helps verify if your webhook endpoint is reachable

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("🧪 TEST WEBHOOK RECEIVED!");
  console.log("Headers:", Object.fromEntries(req.headers));

  const body = await req.text();
  console.log("Body:", body.substring(0, 200));

  return NextResponse.json({
    success: true,
    message: "Test webhook working!",
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Webhook endpoint is live",
    timestamp: new Date().toISOString(),
  });
}
