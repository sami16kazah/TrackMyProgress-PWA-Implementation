import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "./db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
            });
          }
          return true;
        } catch (error) {
          console.error("Error signing in", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      try {
        await dbConnect();
        const sessionUser = await User.findOne({ email: session.user?.email });
        if (sessionUser && session.user) {
          (session.user as any).id = sessionUser._id.toString();
        }
      } catch (error) {
        console.error("Error setting session", error);
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
