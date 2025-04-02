import { Hono } from "hono";
import { createUser, loginUser } from "../controllers/user_controller";

export const auth = new Hono();

auth.post("/signup", createUser);
auth.post("/login", loginUser);
