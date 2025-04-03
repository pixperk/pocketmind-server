import { Context } from "hono";
import { z } from "zod";

export async function lendMoney (c: Context) {
  const body = await c.req.json();
    const schema = z.object({
        amount: z.number().positive(),
        description: z.string().optional(),
        date: z.string().optional(),
        tags: z.array(z.string()).optional(),
    })
}