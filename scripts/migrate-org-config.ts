import { updateOrganizationConfig } from "../src/app/api/config/migrate";

async function main() {
  console.log("Starting organization config migration...");
  
  const success = await updateOrganizationConfig();
  
  if (success) {
    console.log("Migration completed successfully");
    process.exit(0);
  } else {
    console.error("Migration failed");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error during migration:", error);
  process.exit(1);
}); 