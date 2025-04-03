import { Hono } from "hono";
import { lendMoney, markDebtAsCleared } from "../controllers/money_controller";
import { authMiddleware } from "../middlewares/authMiddleware";

export const money = new Hono();

money.post("/lend", authMiddleware, lendMoney);
money.put("/clear/:debtId", authMiddleware, markDebtAsCleared);
