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
        greeting: `hello ${opts.input.name}`
      };
    })
});

// export type definition of API
export type AppRouter = typeof appRouter;
