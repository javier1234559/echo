import { NextResponse } from "next/server";
import { globalConfig } from "@/config";

const MOCK_EMAIL = globalConfig.MOCK_EMAIL;
const MOCK_PASSWORD = globalConfig.MOCK_PASSWORD;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: {
        id: "mock-user-1",
        email: MOCK_EMAIL,
        name: "Example User",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }
}
