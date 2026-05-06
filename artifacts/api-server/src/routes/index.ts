import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import metersRouter from "./meters";
import tokensRouter from "./tokens";
import walletRouter from "./wallet";
import subscriptionsRouter from "./subscriptions";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(metersRouter);
router.use(tokensRouter);
router.use(walletRouter);
router.use(subscriptionsRouter);
router.use(dashboardRouter);

export default router;
