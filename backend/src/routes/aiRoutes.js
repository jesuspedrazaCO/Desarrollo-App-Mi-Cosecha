import { Router } from "express";
import { getConversation, postMessage, startNewConversation } from "../controllers/aiChatController.js";
import { protect } from "../middlewares/authMiddlewares.js";
// ⚠️ Si tu middleware de auth no se llama "protect" ni está en esa ruta, ajusta este import

const router = Router();

router.get("/conversation", protect, getConversation);
router.post("/conversation/new", protect, startNewConversation);
router.post("/conversation/:id/message", protect, postMessage);

export default router;