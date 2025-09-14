import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Ensure we always return to our app host
      try {
        const appHost = process.env.APP_PUBLIC_HOST
          || process.env.NEXT_PUBLIC_APP_HOST
          || process.env.APP_PUBLIC_URL
          || process.env.NEXT_PUBLIC_APP_URL
          || baseUrl;
        if (url.startsWith("/")) return new URL(url, appHost).toString();
        if (new URL(url).origin === baseUrl) return url;
        return appHost;
      } catch {
        return baseUrl;
      }
    },
  },
});

export { handler as GET, handler as POST };
