import { Suspense } from "react";
import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createMetadata } from "@/lib/metadata";
import { isSignUpDisabled } from "@/lib/app-config";

export const metadata = createMetadata({
  title: "Sign Up",
  description: "Create a Hewane School of Music staff account to access the broadcast dashboard.",
  path: "/sign-up",
  noIndex: true,
});

export default async function SignUpPage() {
  if (isSignUpDisabled()) redirect("/sign-in");

  const session = await getServerSession();
  if (session?.user) redirect("/");

  return (
    <Suspense>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
