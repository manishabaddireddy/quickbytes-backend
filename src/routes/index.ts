import { Router } from "express";
import usersRouter from "./users";
import restaurantsRouter from "./restaurants";
import menuItemsRouter from "./menuItems";
import ordersRouter from "./orders";
import authRouter from "./auth";

const router = Router();

router.use(authRouter);
router.use(usersRouter);
router.use(restaurantsRouter);
router.use(menuItemsRouter);
router.use(ordersRouter);

export default router;