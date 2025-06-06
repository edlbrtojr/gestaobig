import { db } from "@/lib/db";

export async function updateOrganizationConfig() {
  try {
    const result = await db.run(`
      MERGE (org:_inAppOrgConfig)
      SET org.name = "Federação das Indústrias do Estado do Acre",
          org.shortName = "FIEAC",
          org.logoUrl = "/uploads/4072219a-04e7-4c79-9428-dc6e5169f574.png",
          org.logoSmallUrl = "/uploads/8af51858-0543-424d-8d59-ba57c1ede5a1.png",
          org.faviconUrl = "/favicon.ico",
          org.primaryColor = "#004a93",
          org.secondaryColor = "#f4791f",
          org.tertiaryColor = "#e5e5e5",
          org.footerText = "© 2025 FIEAC - Todos os direitos reservados",
          org.contactEmail = "fieac@fieac.org.br",
          org.contactPhone = "(68) 3212-4200",
          org.address = "Rua Rui Barbosa, 735 - Centro, Rio Branco - AC, 69900-084",
          org.theme = $theme,
          org.updatedAt = datetime()
      RETURN org
    `, {
      theme: JSON.stringify({
        defaultMode: "light",
        enableSystem: true,
        lightLogo: "/uploads/4072219a-04e7-4c79-9428-dc6e5169f574.png",
        darkLogo: "/uploads/8af51858-0543-424d-8d59-ba57c1ede5a1.png",
      })
    });

    console.log("Application settings updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating application settings:", error);
    return false;
  }
} 