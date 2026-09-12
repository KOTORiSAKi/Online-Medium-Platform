import { Request, Response } from "express";
import * as articleService from "../services/article.service";

// 1. ดึงบทความทั้งหมด
export const getArticles = async (req: Request, res: Response) => {
  try {
    const articles = await articleService.getAllArticles();
    return res.status(200).json(articles);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2. ดึงบทความตาม ID
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await articleService.getArticleById(id);
    if (!article) {
      return res.status(404).json({ message: "ไม่พบบทความนี้" });
    }
    return res.status(200).json(article);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 3. สร้างบทความใหม่
export const createArticle = async (req: any, res: Response) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "กรุณากรอกหัวข้อและเนื้อหา" });
    }

    const newArticle = await articleService.createArticle({ title, content });
    return res.status(201).json(newArticle);
  } catch (error) {
    return res.status(500).json({ message: "ไม่สามารถสร้างบทความได้" });
  }
};
