import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { DefaultSession, NextAuthOptions, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import prisma from './prisma';
import { DEFAULT_WORKSPACE_SLUG } from './workspace-context';

process.env.NEXTAUTH_SECRET ??= 'realestatecrm-dev-secret';
process.env.NEXTAUTH_URL ??= 'http://localhost:3000';

type AuthUser = NextAuthUser & {
  role?: string | null;
  workspaceSlug?: string | null;
  workspaceId?: string | null;
};

type AuthToken = JWT & {
  id?: string;
  role?: string | null;
  workspaceSlug?: string | null;
  workspaceId?: string | null;
};

type SessionUser = DefaultSession['user'] & {
  id?: string;
  role?: string | null;
  workspaceSlug?: string | null;
  workspaceId?: string | null;
};

async function resolvePrimaryWorkspace(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { workspaceId: 'asc' },
    select: {
      role: true,
      workspaceId: true,
    },
  });

  if (membership) {
    return membership;
  }

  const fallbackWorkspace = await prisma.workspace.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (fallbackWorkspace) {
    return {
      role: 'REALTOR_AGENT',
      workspaceId: fallbackWorkspace.id,
    };
  }

  return {
    role: 'REALTOR_AGENT',
    workspaceId: DEFAULT_WORKSPACE_SLUG,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'lum@excellegacy.com' },
        username: { label: 'Username', type: 'text', placeholder: 'lum' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.email?.trim() ?? credentials?.username?.trim() ?? '';
        const password = credentials?.password ?? '';

        const demoEmail = process.env.AUTH_DEMO_EMAIL?.trim() || process.env.MIREALSOURCE_USERNAME?.trim() || '';
        const demoPassword = process.env.AUTH_DEMO_PASSWORD?.trim() || process.env.MIREALSOURCE_PASSWORD?.trim() || '';

        // Universal Admin for Dev
        if (identifier === 'admin@excellegacy.com' && password === 'admin123') {
          return {
            id: 'universal-admin',
            name: 'Universal Admin',
            email: 'admin@excellegacy.com',
            role: 'OWNER',
            workspaceSlug: DEFAULT_WORKSPACE_SLUG,
            workspaceId: DEFAULT_WORKSPACE_SLUG,
          } satisfies AuthUser;
        }

        if (demoEmail && demoPassword && identifier === demoEmail && password === demoPassword) {
          return {
            id: 'demo-user',
            name: process.env.AUTH_DEMO_NAME ?? 'Excel Legacy Admin',
            email: demoEmail,
            role: 'OWNER',
            workspaceSlug: DEFAULT_WORKSPACE_SLUG,
            workspaceId: DEFAULT_WORKSPACE_SLUG,
          } satisfies AuthUser;
        }

        const user = await prisma.user.findUnique({
          where: { email: identifier },
          select: { id: true, name: true, email: true, role: true },
        });

        if (!user) {
          return null;
        }

        const workspace = await resolvePrimaryWorkspace(user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: workspace.role ?? user.role ?? 'REALTOR_AGENT',
          workspaceSlug: workspace.workspaceId,
          workspaceId: workspace.workspaceId,
        } satisfies AuthUser;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      const typedToken = token as AuthToken;

      if (user) {
        const typedUser = user as AuthUser;
        typedToken.id = typedUser.id;
        typedToken.role = typedUser.role ?? undefined;
        typedToken.workspaceSlug = typedUser.workspaceSlug ?? undefined;
        typedToken.workspaceId = typedUser.workspaceId ?? typedUser.workspaceSlug ?? undefined;
      }

      return typedToken;
    },
    session({ session, token }) {
      const typedSession = session as DefaultSession & { user?: SessionUser };
      const typedToken = token as AuthToken;

      if (typedSession.user) {
        typedSession.user.id = typedToken.id;
        typedSession.user.role = typedToken.role ?? null;
        typedSession.user.workspaceSlug = typedToken.workspaceSlug ?? null;
        typedSession.user.workspaceId = typedToken.workspaceId ?? typedToken.workspaceSlug ?? null;
      }

      return typedSession;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET ?? 'realestatecrm-dev-secret',
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
};