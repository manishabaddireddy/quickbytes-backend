import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, insertUserSchema } from "../db/index.js";
import { z } from "zod";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "quickbytes_secret";

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = insertUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values(parsed.data).returning();

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    message: "Account created successfully",
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// POST /api/auth/login
const loginSchema = z.object({
  email: z.string().email(),
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (!user) {
    res.status(401).json({ error: "No account found with this email. Please register first." });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login successful",
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

export default router;