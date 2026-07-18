import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a PlaceIQ account to save favorite companies and contribute placement & PS experiences.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
