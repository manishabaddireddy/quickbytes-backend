import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, insertOrderSchema } from "../db/index.js";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/orders — place a new order (protected)
const placeOrderSchema = z.object({
  restaurantId: z.number(),
  deliveryAddress: z.string().min(1),
  items: z.array(z.object({
    menuItemId: z.number(),
    quantity: z.number().min(1),
  })).min(1, "Order must have at least one item"),
});

router.post("/orders", authenticate, async (req: AuthRequest, res) => {
  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { restaurantId, deliveryAddress, items } = parsed.data;

  // Calculate total amount from menu items
  let totalAmount = 0;
  const itemsWithPrice = [];

  for (const item of items) {
    const [menuItem] = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, item.menuItemId));

    if (!menuItem) {
      res.status(404).json({ error: `Menu item ${item.menuItemId} not found` });
      return;
    }

    const unitPrice = parseFloat(menuItem.price);
    totalAmount += unitPrice * item.quantity;
    itemsWithPrice.push({ ...item, unitPrice: menuItem.price });
  }

  // Create order
  const [order] = await db.insert(ordersTable).values({
    userId: req.userId!,
    restaurantId,
    deliveryAddress,
    totalAmount: totalAmount.toFixed(2),
    status: "pending",
  }).returning();

  // Create order items
  const orderItems = await db.insert(orderItemsTable).values(
    itemsWithPrice.map((item) => ({
      orderId: order.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }))
  ).returning();

  res.status(201).json({ order, items: orderItems });
});

// GET /api/orders — get orders for logged in user (protected)
router.get("/orders", authenticate, async (req: AuthRequest, res) => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.userId!))
    .orderBy(ordersTable.id);

  res.json(orders);
});

// GET /api/orders/:id — get single order with items (protected)
router.get("/orders/:id", authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  if (order.userId !== req.userId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, id));

  res.json({ order, items });
});

// PATCH /api/orders/:id/status — update order status
router.patch("/orders/:id/status", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, id))
    .returning();

  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
});

export default router;