import type { Metadata } from "next";
import { PasswordForm } from "../password-form";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <PasswordForm mode="request" />;
}
