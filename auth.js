import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/backend/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      id: "token-verification",
      name: "Token Verification",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          throw new Error("Missing verification token");
        }

        const verificationRecord = await prisma.verificationToken.findUnique({
          where: { token: credentials.token },
        });

        if (!verificationRecord) {
          throw new Error("Invalid or already used verification token");
        }

        const hasExpired = new Date() > new Date(verificationRecord.expiresAt);
        if (hasExpired) {
          await prisma.verificationToken.delete({ where: { token: credentials.token } });
          throw new Error("Verification token expired");
        }

        // Atomically mark verified and delete used token
        const [updatedUser] = await prisma.$transaction([
          prisma.user.update({
            where: { email: verificationRecord.email },
            data: { emailVerified: true },
          }),
          prisma.verificationToken.delete({
            where: { token: credentials.token },
          }),
        ]);

        return { id: updatedUser.id, email: updatedUser.email };
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }
        
        return { id: user.id, email: user.email };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: { strategy: "jwt" }
})
