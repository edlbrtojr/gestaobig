"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("system");
  
  // Ensure we have client-side values
  useEffect(() => {
    setCurrentTheme(theme || "system");
  }, [theme]);

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setCurrentTheme(value);
    setTheme(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium">Tema</h4>
        <p className="text-sm text-muted-foreground">
          Selecione o tema para a interface do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          className={`cursor-pointer flex flex-col items-center gap-2 rounded-md border-2 ${
            currentTheme === "light" ? "border-primary" : "border-muted"
          } bg-popover p-4 hover:bg-accent hover:text-accent-foreground`}
          onClick={() => handleThemeChange("light")}
        >
          <Sun className="h-6 w-6" />
          <div>
            <p className="text-sm font-medium">Claro</p>
            <p className="text-xs text-muted-foreground">
              Tema claro para ambientes bem iluminados
            </p>
          </div>
        </div>
        
        <div 
          className={`cursor-pointer flex flex-col items-center gap-2 rounded-md border-2 ${
            currentTheme === "dark" ? "border-primary" : "border-muted"
          } bg-popover p-4 hover:bg-accent hover:text-accent-foreground`}
          onClick={() => handleThemeChange("dark")}
        >
          <Moon className="h-6 w-6" />
          <div>
            <p className="text-sm font-medium">Escuro</p>
            <p className="text-xs text-muted-foreground">
              Tema escuro para reduzir o cansaço visual
            </p>
          </div>
        </div>
        
        <div 
          className={`cursor-pointer flex flex-col items-center gap-2 rounded-md border-2 ${
            currentTheme === "system" ? "border-primary" : "border-muted"
          } bg-popover p-4 hover:bg-accent hover:text-accent-foreground`}
          onClick={() => handleThemeChange("system")}
        >
          <Monitor className="h-6 w-6" />
          <div>
            <p className="text-sm font-medium">Sistema</p>
            <p className="text-xs text-muted-foreground">
              Segue o tema do seu sistema operacional
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleThemeChange("system")}
        >
          Redefinir Padrões
        </Button>
      </div>
    </div>
  );
} 