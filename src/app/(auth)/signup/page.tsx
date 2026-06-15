import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Criar conta — PlataformaListas",
};

export default function SignupPage() {
  return <SignupForm />;
}
