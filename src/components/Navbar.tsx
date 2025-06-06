import Link from "next/link";
import { PERMISSIONS } from "@/lib/permissions";

// Dentro do componente de navegação, adicionar um link direto sem verificação
<Link
  href="/admin/users"
  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
>
  Admin
</Link> 