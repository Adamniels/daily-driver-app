import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { loginInputSchema, registerInputSchema } from '@habit/shared';
import { signToken } from '../../auth/jwt.js';
import { hashPassword, verifyPassword } from '../../auth/password.js';
import { creatures, users } from '../../db/schema.js';
import { protectedProcedure, publicProcedure, router } from '../trpc.js';
import type { UserRow } from '../context.js';

function publicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    timezone: user.timezone,
  };
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const authRouter = router({
  register: publicProcedure.input(registerInputSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.config.allowMultiUser) {
      const anyone = await ctx.db.select({ id: users.id }).from(users).limit(1);
      if (anyone.length > 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This instance is personal — registration is closed.',
        });
      }
    }

    const timezone = input.timezone ?? 'Europe/Stockholm';
    if (!isValidTimeZone(timezone)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown timezone: ${timezone}` });
    }

    const email = input.email.toLowerCase();
    const existing = await ctx.db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered.' });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await ctx.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({ email, passwordHash, displayName: input.displayName, timezone })
        .returning();
      if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      // The hatching moment: every account starts with its companion.
      await tx.insert(creatures).values({ userId: created.id, name: input.creatureName ?? 'Blob' });
      return created;
    });

    return { token: await signToken(user.id, ctx.config.jwtSecret), user: publicUser(user) };
  }),

  login: publicProcedure.input(loginInputSchema).mutation(async ({ ctx, input }) => {
    const email = input.email.toLowerCase();
    const [user] = await ctx.db.select().from(users).where(eq(users.email, email)).limit(1);
    // Same error either way: no account/password oracle.
    const failed = new TRPCError({ code: 'UNAUTHORIZED', message: 'Wrong email or password.' });
    if (!user) throw failed;
    if (!(await verifyPassword(user.passwordHash, input.password))) throw failed;

    return { token: await signToken(user.id, ctx.config.jwtSecret), user: publicUser(user) };
  }),

  me: protectedProcedure.query(({ ctx }) => publicUser(ctx.user)),
});
