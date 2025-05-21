import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import AppearanceForm from "./appearance-form";

export const metadata: Metadata = {
  title: "Aparência | Configurações",
  description: "Gerencie as configurações de aparência do sistema Frigg.",
};

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Aparência</h3>
        <p className="text-sm text-muted-foreground">
          Personalize a aparência e o tema da interface.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  );
} 