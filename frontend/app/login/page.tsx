import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to PlaceIQ to save favorite companies, track your profile and submit experiences.",
};

export default function LoginPage() {
  return <LoginForm />;
}
