import NextAuth, { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import neo4j from "neo4j-driver";
import bcrypt from "bcryptjs";

// Estendendo o tipo User para incluir campos adicionais
interface ExtendedUser extends User {
  isSystemAdmin?: boolean;
  authType?: string;
}

// Estendendo o tipo Session para incluir campos adicionais
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isSystemAdmin?: boolean;
      authType?: string;
    }
  }
}

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || ""
  ),
  {
    disableLosslessIntegers: true,
  }
);

export const authOptions: AuthOptions = {
  // Removendo o adapter e usando apenas JWT
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  // Configuração de cookies para melhorar persistência
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 dias (igual à sessão)
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credenciais incompletas", { email: credentials?.email });
          return null;
        }
        
        const session = driver.session();
        
        try {
          console.log("Tentando autenticar usuário:", credentials.email);
          
          // Buscar usuário pelo email
          const result = await session.run(
            `MATCH (u:_User {email: $email})
            RETURN u`,
            { email: credentials.email }
          );
          
          if (result.records.length === 0) {
            console.log("Usuário não encontrado:", credentials.email);
            return null;
          }
          
          const user = result.records[0].get('u').properties;
          console.log("Usuário encontrado:", user.email);
          console.log("Detalhes do usuário (sem senha):", { ...user, password: "******" });
          
          // Verificar senha
          let isValidPassword = false;
          
          // Verificar se a senha está em texto plano ou hash
          if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
            // Se for hash bcrypt, usar bcrypt.compare
            isValidPassword = await bcrypt.compare(
              credentials.password,
              user.password
            );
          } else {
            // Se for texto plano, comparar diretamente
            isValidPassword = credentials.password === user.password;
            console.log("Comparando senha em texto plano:", { isValid: isValidPassword });
          }
          
          if (!isValidPassword) {
            console.log("Senha inválida para usuário:", credentials.email);
            return null;
          }
          
          // Atualizar última data de login
          await session.run(
            `MATCH (u:_User {email: $email})
            SET u.lastLogin = datetime()
            RETURN u`,
            { email: credentials.email }
          );
          
          console.log("Login bem-sucedido para:", credentials.email);
          
          // Retornar informações do usuário (sem a senha)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isSystemAdmin: user.isSystemAdmin,
            authType: user.authType
          } as ExtendedUser;
        } catch (error) {
          console.error("Erro ao autenticar usuário:", error);
          return null;
        } finally {
          await session.close();
        }
      }
    }),
    // Adicionar provider do Microsoft Entra ID (Azure AD)
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email offline_access"
        }
      },
      profile(profile) {
        console.log("Profile do Azure AD:", profile);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: null,
          authType: "sso"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      console.log(`JWT Callback - Trigger: ${trigger}`);
      console.log("JWT Callback - Token:", token);
      
      // Don't log sensitive information in production
      if (process.env.NODE_ENV !== "production") {
        console.log("JWT Callback - User:", user ? { ...user, password: undefined } : null);
        console.log("JWT Callback - Account:", account);
      }
      
      // Always maintain existing token data
      if (token && !user) {
        return token;
      }
      
      // Adicionar informações adicionais ao token JWT
      if (user) {
        // Informações do usuário na primeira autenticação
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.isSystemAdmin = (user as ExtendedUser).isSystemAdmin || false;
        token.authType = (user as ExtendedUser).authType || (account?.provider === "azure-ad" ? "sso" : "local");
        
        // Se for login do Azure AD, criar ou atualizar o usuário no Neo4j
        if (account?.provider === "azure-ad" && profile?.email) {
          try {
            const neo4jSession = driver.session();
            
            // Verificar se o usuário já existe
            const checkResult = await neo4jSession.run(
              `MATCH (u:_User {email: $email}) RETURN u`,
              { email: profile.email }
            );
            
            let userId;
            
            if (checkResult.records.length === 0) {
              // Criar novo usuário
              console.log("Criando novo usuário SSO:", profile.email);
              const createResult = await neo4jSession.run(
                `CREATE (u:_User {
                  id: randomUUID(),
                  name: $name,
                  email: $email,
                  authType: 'sso',
                  active: true,
                  isSystemAdmin: false,
                  createdAt: datetime(),
                  lastLogin: datetime()
                }) RETURN u`,
                { 
                  email: profile.email,
                  name: profile.name || profile.email
                }
              );
              
              userId = createResult.records[0].get('u').properties.id;
            } else {
              // Atualizar usuário existente
              console.log("Atualizando usuário SSO existente:", profile.email);
              const updateResult = await neo4jSession.run(
                `MATCH (u:_User {email: $email})
                SET u.name = $name,
                    u.lastLogin = datetime()
                RETURN u`,
                { 
                  email: profile.email,
                  name: profile.name || profile.email
                }
              );
              
              userId = updateResult.records[0].get('u').properties.id;
              
              // Se o usuário já existir, pegar suas informações adicionais (como isSystemAdmin)
              token.isSystemAdmin = checkResult.records[0].get('u').properties.isSystemAdmin || false;
            }
            
            // Atualizar o ID no token com o ID do Neo4j
            token.id = userId;
            
            await neo4jSession.close();
          } catch (error) {
            console.error("Erro ao criar/atualizar usuário SSO no Neo4j:", error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        console.log("Session Callback - Input session:", session);
        console.log("Session Callback - Token:", { 
          id: token?.id,
          email: token?.email,
          isSystemAdmin: token?.isSystemAdmin,
          authType: token?.authType
        });
        
        // Adicionar informações do token à sessão
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.isSystemAdmin = token.isSystemAdmin as boolean;
          session.user.authType = token.authType as string;
          
          // Garantir que outros campos essenciais também sejam definidos
          if (!session.user.email && token.email) {
            session.user.email = token.email as string;
          }
          if (!session.user.name && token.name) {
            session.user.name = token.name as string;
          }
        }
        
        console.log("Session Callback - Output session:", session);
        return session;
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',  // Página de erro de login
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 