import { NextResponse } from "next/server";
import { isSignUpDisabled } from "@/lib/app-config";

export async function GET() {
  return NextResponse.json({
    signUpDisabled: isSignUpDisabled(),
  });
}
