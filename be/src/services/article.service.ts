// src/services/article.service.ts
export const getAllArticles = async () => {
  // ข้อมูลจำลองชั่วคราวระหว่างทดสอบ Server
  return [{ id: "1", title: "บทความทดสอบ 1", content: "เนื้อหาทดสอบ" }];
};

export const getArticleById = async (id: string) => {
  return { id, title: `บทความที่ ${id}`, content: "เนื้อหาทดสอบ" };
};

export const createArticle = async (data: {
  title: string;
  content: string;
}) => {
  return { id: Date.now().toString(), ...data };
};
