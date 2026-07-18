import type { Metadata } from "next";
import { PasswordForm } from "../password-form";

export const metadata: Metadata = {
  title: "Şifre Yenile",
  robots: { index: false },
};

export default function UpdatePasswordPage() {
  return <PasswordForm mode="update" />;
}
