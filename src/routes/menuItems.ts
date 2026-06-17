import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, menuItemsTable, restaurantsTable, insertMenuItemSchema } from "../db";
import { z } from "zod";

const router = Router();

// GET /api/restaurants/:id/menu-items?category=
router.get("/restaurants/:id/menu-items", async (req, res) => {
  const restaurantId = parseInt(req.params.id, 10);
  if (isNaN(restaurantId)) { res.status(400).json({ error: "Invalid id" }); return; }
  let rows = await db.select().from(menuItemsTable).where(eq(menuItemsTable.restaurantId, restaurantId));
  if (req.query.category) {
    const cat = (req.query.category as string).toLowerCase();
    rows = rows.filter((m) => m.category.toLowerCase().includes(cat));
  }
  res.json(rows);
});

// POST /api/restaurants/:id/menu-items
router.post("/restaurants/:id/menu-items", async (req, res) => {
  const restaurantId = parseInt(req.params.id, 10);
  if (isNaN(restaurantId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [restaurant] = await db.select({ id: restaurantsTable.id }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
  if (!restaurant) { res.status(404).json({ error: "Restaurant not found" }); return; }
  const bodySchema = insertMenuItemSchema.omit({ restaurantId: true });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [menuItem] = await db.insert(menuItemsTable).values({ ...parsed.data, restaurantId }).returning();
  res.status(201).json(menuItem);
});

// GET /api/menu-items/:id
router.get("/menu-items/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [item] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, id));
  if (!item) { res.status(404).json({ error: "Menu item not found" }); return; }
  res.json(item);
});

// PUT /api/menu-items/:id
router.put("/menu-items/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = insertMenuItemSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.update(menuItemsTable).set(parsed.data).where(eq(menuItemsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Menu item not found" }); return; }
  res.json(item);
});

// DELETE /api/menu-items/:id
router.delete("/menu-items/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [item] = await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Menu item not found" }); return; }
  res.sendStatus(204);
});

export default router;
