import { Router } from "express";
import {
  getArticles,
  getArticleById,
  createArticle,
} from "../controllers/article.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getArticles);
router.get("/:id", getArticleById);
router.post("/", verifyToken, createArticle);

export default router;
