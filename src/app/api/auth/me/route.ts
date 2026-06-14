import { NextResponse } from "next/server";
import { globalConfig } from "@/config";

const MOCK_EMAIL = globalConfig.MOCK_EMAIL;

export async function GET(request: Request) {
  try {
    return NextResponse.json({
      user: {
        id: "mock-user-1",
        email: MOCK_EMAIL,
        name: "Example User",
      },
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
