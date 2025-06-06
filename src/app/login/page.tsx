import type { Metadata } from "next";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | Neo4js",
  description: "Entre na sua conta para acessar o sistema Neo4js.",
};

export default function LoginPage(): React.ReactNode {
  return <LoginForm />;
} 