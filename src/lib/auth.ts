
import { SignJWT, jwtVerify } from "jose";
import { AUTH_CODE, DURATION_EXPIRE_TIME } from "@/constants/auth";
import { ACCESS_TOKEN_EXPIRE_TIME } from "@/constants/auth";
import { User } from "@/types/auth";
import CrudOperations from '@/lib/crud-operations';
import { JWTPayload } from "./api-utils";

// JWT config
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * crud instances of system auth operations - VERSION SIMPLIFIÉE
 */
export async function authCrudOperations(): Promise<{
  usersCrud: CrudOperations;
  sessionsCrud: CrudOperations;
  refreshTokensCrud: CrudOperations;
  userPasscodeCrud: CrudOperations;
}> {
  try {
    const adminUserToken = await generateAdminUserToken();

    return {
      usersCrud: new CrudOperations("users", adminUserToken),
      sessionsCrud: new CrudOperations("sessions", adminUserToken),
      refreshTokensCrud: new CrudOperations("refresh_tokens", adminUserToken),
      userPasscodeCrud: new CrudOperations("user_passcode", adminUserToken),
    };
  } catch (error) {
    console.error('Erreur lors de la création des opérations CRUD auth:', error);
    throw error;
  }
}

// Create an admin token - SIMPLIFIÉ
export async function generateAdminUserToken() {
  try {
    const adminUserToken = await generateToken({
      sub: "",
      email: "",
      role: process.env.SCHEMA_ADMIN_USER || "",
    }, DURATION_EXPIRE_TIME);
    return adminUserToken;
  } catch (error) {
    console.error('Erreur lors de la génération du token admin:', error);
    throw error;
  }
}

// Generate access token - SIMPLIFIÉ
export async function generateToken(user: Omit<User, "isAdmin">, expiresIn: number = ACCESS_TOKEN_EXPIRE_TIME): Promise<string> {
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    sub: user.sub.toString(),
    email: user.email,
    role: user.role,
    isAdmin: user.role === process.env.SCHEMA_ADMIN_USER,
  };

  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${expiresIn}s`)
      .sign(JWT_SECRET);
    return token;
  } catch (error) {
    console.error('Erreur lors de la génération du token:', error);
    throw error;
  }
}

// Verify JWT token - SIMPLIFIÉ
export async function verifyToken(
  token?: string | null
): Promise<{ valid: boolean; code: string; payload: JWTPayload | null }> {
  if (!token) {
    return {
      valid: false,
      code: AUTH_CODE.TOKEN_MISSING,
      payload: null,
    };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      valid: true,
      code: AUTH_CODE.SUCCESS,
      payload: payload as unknown as JWTPayload,
    };
  } catch (error: any) {
    // Expired - notify client to refresh token
    if (error.code === "ERR_JWT_EXPIRED") {
      return { valid: false, code: AUTH_CODE.TOKEN_EXPIRED, payload: null };
    }
    // All other cases treated as invalid signature - require re-login
    return { valid: false, code: AUTH_CODE.TOKEN_MISSING, payload: null };
  }
}

// NextAuth compatibility export (for API routes)
export const authOptions = {
  providers: [],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.isAdmin = user.role === process.env.SCHEMA_ADMIN_USER;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  secret: process.env.JWT_SECRET,
};
