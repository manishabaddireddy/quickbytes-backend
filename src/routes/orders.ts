import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, ORDER_STATUSES } from "../db";
import { z } from "zod";

const placeOrderSchema = z.object({
  userId: z.number().int(),
  restaurantId: z.number().int(),
  deliveryAddress: z.string().min(1),
  items: z.array(z.object({
    menuItemId: z.number().int(),
    quantity: z.number().int().min(1),
  })).min(1),
});

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

const router = Router();

// GET /api/orders?userId=&status=
router.get("/orders", async (req, res) => {
  let rows = await db.select().from(ordersTable).orderBy(ordersTable.id);
  if (req.query.userId) rows = rows.filter((o) => o.userId === parseInt(req.query.userId as string, 10));
  if (req.query.status) rows = rows.filter((o) => o.status === req.query.status);
  res.json(rows);
});

// POST /api/orders  (total computed server-side)
router.post("/orders", async (req, res) => {
  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { userId, restaurantId, deliveryAddress, items } = parsed.data;

  const menuItems = await db.select().from(menuItemsTable).where(eq(menuItemsTable.restaurantId, restaurantId));
  const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));

  for (const item of items) {
    if (!priceMap.has(item.menuItemId)) {
      res.status(400).json({ error: `Menu item ${item.menuItemId} not in this restaurant` });
      return;
    }
  }

  const totalAmount = items
    .reduce((sum, item) => sum + parseFloat(priceMap.get(item.menuItemId)!) * item.quantity, 0)
    .toFixed(2);

  const [order] = await db.insert(ordersTable)
    .values({ userId, restaurantId, deliveryAddress, totalAmount, status: "pending" })
    .returning();

  const insertedItems = await db.insert(orderItemsTable)
    .values(items.map((item) => ({
      orderId: order.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: priceMap.get(item.menuItemId)!,
    })))
    .returning();

  res.status(201).json({ ...order, items: insertedItems });
});

// GET /api/orders/:id
router.get("/orders/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json({ ...order, items: orderItems });
});

// PATCH /api/orders/:id/status
router.patch("/orders/:id/status", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [order] = await db.update(ordersTable).set({ status: parsed.data.status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
});

// DELETE /api/orders/:id
router.delete("/orders/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [order] = await db.delete(ordersTable).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.sendStatus(204);
});

// GET /api/orders/:id/items
router.get("/orders/:id/items", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [order] = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(orderItems);
});

export default router;