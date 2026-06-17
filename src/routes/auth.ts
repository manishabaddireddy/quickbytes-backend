import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, insertUserSchema } from "../db/index.js";
import { z } from "zod";

const router = Router();

// POST /api/auth/register — create a new account
router.post("/auth/register", async (req, res) => {
  const parsed = insertUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Check if email already exists
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json({
    message: "Account created successfully",
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// POST /api/auth/login — login with email (simple, no password hashing for now)
const loginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
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

  res.json({
    message: "Login successful",
    user: { id: user.id, name: user.name, email: user.email },
  });
});

export default router;
