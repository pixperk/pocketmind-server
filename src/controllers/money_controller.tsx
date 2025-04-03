import { Context } from "hono";
import { boolean, z } from "zod";
import { getPrisma } from "../util/db";

export async function lendMoney(c: Context) {
  const body = await c.req.json();
  const schema = z.object({
    amount: z.number().positive(),
    currency: z.enum(["USD", "INR"]),
    description: z.string().optional(),
    dueDate: z.coerce.date().optional(),
    debtorId: z.string().uuid(),
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.format() }, 400);
  }

  const { amount, currency, description, debtorId, dueDate } = result.data;
  const prisma = getPrisma(c.env.DATABASE_URL);
  const creditorId = c.get("jwtPayload")?.userId as string;
  try {
    const debtorExists = await prisma.user.findUnique({
        where: { id: debtorId },
      });
  
      if (!debtorExists) {
        return c.json({ error: "Debtor does not exist" }, 400);
      }

      if (debtorId === creditorId) {
        return c.json({ error: "You cannot lend money to yourself" }, 400);
      }
  
    const debt = await prisma.debt.create({
      data: {
        amount,
        currency,
        description,
        debtorId,
        dateOfLending: new Date(),
        status: "pending",
        creditorId,
        dueDate,
      },
    });
    return c.json({ message: "Money lent successfully", debt }, 201);
  } catch (error) {
    console.error("Error creating debt:", error);
    return c.json({ error: "Failed to create debt" }, 500);
  }
}


export async function markDebtAsCleared(c: Context) {
 

  const { debtId } = c.req.param();
  if (!debtId) {
    return c.json({ error: "Debt ID is required" }, 400);
  }
  const prisma = getPrisma(c.env.DATABASE_URL);
  const creditorId = c.get("jwtPayload")?.userId as string;

  try {
    const debt = await prisma.debt.update({
      where: {
        id: debtId,
        creditorId,
      },
      data: {
        status: "completed",
      },
    });

    if (!debt) {
      return c.json({ error: "Debt not found or you are not the creditor" }, 404);
    }

    return c.json({ message: "Debt marked as cleared", debt }, 200);
  } catch (error) {
    console.error("Error updating debt:", error);
    return c.json({ error: "Failed to update debt" }, 500);
  }
}

export async function getMyDebts(c: Context) {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId = c.get("jwtPayload")?.userId as string;
    const isCompleted =  c.req.query("isCompleted")

    if (isCompleted !== "true" && isCompleted !== "false") {
        return c.json({ error: "isCompleted must be a boolean" }, 400);
    }
    try {
        const debts = await prisma.debt.findMany({
        where: {
            debtorId: userId,
            status: isCompleted === "true" ? "completed" : "pending",

        },
        include: {
            creditor: true,
            debtor: true,
        },
        });
        return c.json(debts, 200);
    } catch (error) {
        console.error("Error fetching debts:", error);
        return c.json({ error: "Failed to fetch debts" }, 500);
    }
}