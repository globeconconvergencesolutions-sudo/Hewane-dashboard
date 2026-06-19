import { Suspense } from "react";
import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createMetadata } from "@/lib/metadata";
import { isSignUpDisabled } from "@/lib/app-config";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to the Hewane School of Music staff dashboard to manage contacts and WhatsApp campaigns.",
  path: "/sign-in",
  noIndex: true,
});

export default async function SignInPage() {
  const session = await getServerSession();
  if (session?.user) redirect("/");

  return (
    <Suspense>
      <AuthForm mode="sign-in" signUpDisabled={isSignUpDisabled()} />
    </Suspense>
  );
}
