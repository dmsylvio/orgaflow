import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// O NextAuth retorna um handler (Função)
const handler = NextAuth(authOptions);

/**
 * Para o App Router no Next 13, precisamos exportar
 * o handler tanto para GET quanto para POST.
 * Assim, ele tratará as requisições de login, logout, callback etc.
 */
export { handler as GET, handler as POST };
