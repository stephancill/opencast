import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const appRouter = router({
  greeting: publicProcedure
    .input(
      z.object({
        name: z.string()
      })
    )
    .query((opts) => {
      return {
        greeting: `helllllo ${opts.input.name}`
      };
    }),
  getUser: publicProcedure.input(z.string()).query((opts) => {
    return {
      user: {
        privyId: opts.input
      }
    };
  })
});

// export type definition of API
export type AppRouter = typeof appRouter;
