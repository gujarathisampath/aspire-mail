import { NextResponse } from "next/server";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid login data." },
      { status: 400 },
    );
  }

  const result = await loginAction(parsed.data);

  if (!result.success) {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}