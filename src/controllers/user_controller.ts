import { Context } from "hono";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../util/password";
import { getPrisma } from "../util/db";
import { generateToken } from "../util/token";

export async function createUser(c: Context) {
  const body = await c.req.json();
  const schema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    avatar: z.string(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  const { username, email, password, avatar } = parsed.data;

  const prisma = getPrisma(c.env.DATABASE_URL);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (user)
    return c.json(
      { error: "User with this username/email already exists" },
      400
    );

  const hashedPassword = await hashPassword(password);
  if (!hashedPassword) return c.json({ error: "Failed to hash password" }, 500);

  const createdUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      avatar,
    },
  });

  const responseUser = {
    id: createdUser.id,
    username: createdUser.username,
    email: createdUser.email,
    avatar: createdUser.avatar,
    createdAt: createdUser.createdAt,
  };

  return c.json({ user: responseUser }, 201);
}

export async function loginUser(c: Context) {
  const body = await c.req.json();
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  const { email, password } = parsed.data;

  const prisma = getPrisma(c.env.DATABASE_URL);

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user)
    return c.json({ error: "User with the given email does not exist" }, 401);

  const isValidPassword = await verifyPassword(password, user.password!);
  if (!isValidPassword)
    return c.json({ error: "Invalid email or password" }, 401);

  const token = await generateToken(user.id, c);

  const responseUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  return c.json({ token, user: responseUser }, 200);
}
