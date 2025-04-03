import { currency } from "@prisma/client/edge";
import { Context } from "hono";
import { z } from "zod";

export async function lendMoney (c: Context) {
  const body = await c.req.json();
    const schema = z.object({
        amount: z.number().positive(),
        currency : z.enum(['USD', 'INR']),
        description: z.string().optional(),
        debtorId : z.string().uuid(),

       
    })
}