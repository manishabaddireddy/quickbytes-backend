import { Router } from "express";
import usersRouter from "./users";
import restaurantsRouter from "./restaurants";
import menuItemsRouter from "./menuItems";
import ordersRouter from "./orders";

const router = Router();

router.use(usersRouter);
router.use(restaurantsRouter);
router.use(menuItemsRouter);
router.use(ordersRouter);

export default router;