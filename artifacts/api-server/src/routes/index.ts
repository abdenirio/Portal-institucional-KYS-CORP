import { Router, type IRouter } from "express";
import healthRouter from "./health";
import portalRouter from "./portal";
import contactRouter from "./contact";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portalRouter);
router.use(contactRouter);
router.use(adminRouter);

export default router;
