"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Estilos inline para animações
const slideUpInStyle: React.CSSProperties = {
  animation: "slideUpIn 0.5s ease forwards",
};

const slideUpOutStyle: React.CSSProperties = {
  animation: "slideUpOut 0.5s ease forwards",
};

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [previousLogoIndex, setPreviousLogoIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const { login, loginWithMicrosoft, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  
  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, isLoading, router, callbackUrl]);
  
  const logos = [
    { src: "/images/Logo FIEAC Branca.png", alt: "FIEAC" },
    { src: "/images/Logo SENAI Branca.png", alt: "SENAI" },
    { src: "/images/Logo SESI Branca.png", alt: "SESI" },
    { src: "/images/Logo IEL Branca.png", alt: "IEL" },
    { src: "/images/logo-Sitema fieac-branco.png", alt: "Sistema FIEAC" }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousLogoIndex(currentLogoIndex);
      setIsAnimating(true);
      
      // Definir o próximo índice
      setCurrentLogoIndex((prevIndex) => (prevIndex + 1) % logos.length);
      
      // Resetar a animação após a conclusão
      const animationTimeout = setTimeout(() => {
        setIsAnimating(false);
      }, 600);
      
      return () => clearTimeout(animationTimeout);
    }, 3000); // Troca a cada 3 segundos
    
    return () => clearInterval(interval);
  }, [currentLogoIndex, logos.length]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const success = await login(data.email, data.password);
    if (success) {
      router.push(callbackUrl);
    }
  };

  const handleMicrosoftLogin = async () => {
    await loginWithMicrosoft();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Entrar na sua conta</h1>
          <p className="text-sm text-muted-foreground">
            Digite seu email e senha para acessar sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none text-foreground">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  className={`flex h-10 w-full rounded-md border ${
                    errors.email ? "border-destructive" : "border-input"
                  } bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium leading-none text-foreground">
                  Senha
                </label>
                <a href="#" className="text-xs text-primary hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`flex h-10 w-full rounded-md border ${
                    errors.password ? "border-destructive" : "border-input"
                  } bg-background px-3 py-2 pl-10 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Ou continue com seu E-mail do Sistema FIEAC</span>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-md border border-input bg-[#004899] px-4 text-sm font-medium text-white transition-colors hover:bg-[#003e86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={handleMicrosoftLogin}
            type="button"
          >
            <div className="relative h-8 w-32 flex items-center justify-center overflow-hidden">
              {previousLogoIndex >= 0 && (
                <img
                  key={`prev-${logos[previousLogoIndex].alt}`}
                  src={logos[previousLogoIndex].src}
                  alt={logos[previousLogoIndex].alt}
                  style={{
                    ...slideUpOutStyle,
                    position: "absolute",
                    height: "32px",
                    width: "auto",
                    objectFit: "contain",
                    display: isAnimating ? "block" : "none"
                  }}
                />
              )}
              <img
                key={`current-${logos[currentLogoIndex].alt}`}
                src={logos[currentLogoIndex].src}
                alt={logos[currentLogoIndex].alt}
                style={{
                  ...(isAnimating ? slideUpInStyle : {}),
                  position: "absolute",
                  height: "32px",
                  width: "auto",
                  objectFit: "contain"
                }}
              />
            </div>
            <span>Sistema FIEAC</span>
          </button>
        </div>

        <style jsx>{`
          @keyframes slideUpIn {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideUpOut {
            from {
              transform: translateY(0);
              opacity: 1;
            }
            to {
              transform: translateY(-100%);
              opacity: 0;
            }
          }
        `}</style>

        <div className="text-center space-y-2">
          <div className="text-xs text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Ao fazer login, você concorda com nossos{" "}
            <a href="#" className="text-primary hover:underline">
              Termos de Serviço
            </a>{" "}
            e{" "}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidade
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 