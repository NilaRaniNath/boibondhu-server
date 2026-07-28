import { Router, Request, Response } from "express";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDB } from "../lib/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import type { Book } from "../types";

const router = Router();

const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  description: z.string().min(1).max(5000),
  price: z.coerce.number().positive(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).min(1, "At least one image is required").optional(),
  category: z.string().min(1).max(100),
  condition: z.enum(["new", "like_new", "used"]).default("new"),
  stock: z.coerce.number().int().min(0),
  isbn: z.string().optional(),
  pages: z.coerce.number().int().positive(),
  language: z.string().min(1).max(50),
  publishedYear: z.coerce.number().int().min(1000).max(2100),
}).refine(
  (data) => data.coverImage || (data.images && data.images.length > 0),
  { message: "Either coverImage or at least one image is required", path: ["images"] }
);

const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  author: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(5000).optional(),
  price: z.coerce.number().positive().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).min(1, "At least one image is required").optional(),
  category: z.string().min(1).max(100).optional(),
  condition: z.enum(["new", "like_new", "used"]).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  isbn: z.string().optional(),
  pages: z.coerce.number().int().positive().optional(),
  language: z.string().min(1).max(50).optional(),
  publishedYear: z.coerce.number().int().min(1000).max(2100).optional(),
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDB();
    const books = db.collection<Book>("books");

    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      sortBy,
      page = "1",
      limit = "8",
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { isActive: true };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { author: { $regex: escaped, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (condition) {
      filter.condition = condition;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = parseFloat(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = parseFloat(maxPrice);
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === "price_asc") sort = { price: 1 };
    else if (sortBy === "price_desc") sort = { price: -1 };
    else if (sortBy === "newest") sort = { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 8));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      books.find(filter).sort(sort).skip(skip).limit(limitNum).toArray(),
      books.countDocuments(filter),
    ]);

    res.json({
      books: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Get books error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const db = getDB();
    const book = await db.collection<Book>("books").findOne({
      _id: new ObjectId(id),
      isActive: true,
    });

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.json(book);
  } catch (err) {
    console.error("Get book error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createBookSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("Book validation errors:", parsed.error.flatten().fieldErrors);
        res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const { images, coverImage, ...rest } = parsed.data;
      const finalCoverImage = coverImage || (images && images.length > 0 ? images[0] : "");

      const db = getDB();
      const now = new Date();

      const result = await db.collection<Book>("books").insertOne({
        ...rest,
        coverImage: finalCoverImage,
        images: images || (finalCoverImage ? [finalCoverImage] : []),
        totalSold: 0,
        rating: 0,
        numReviews: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const book = await db.collection<Book>("books").findOne({ _id: result.insertedId });

      res.status(201).json(book);
    } catch (err) {
      console.error("Create book error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid book ID" });
        return;
      }

      const parsed = updateBookSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const db = getDB();
      const result = await db.collection<Book>("books").findOneAndUpdate(
        { _id: new ObjectId(id), isActive: true },
        { $set: { ...parsed.data, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!result) {
        res.status(404).json({ message: "Book not found" });
        return;
      }

      res.json(result);
    } catch (err) {
      console.error("Update book error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid book ID" });
        return;
      }

      const db = getDB();
      const result = await db.collection<Book>("books").findOneAndUpdate(
        { _id: new ObjectId(id), isActive: true },
        { $set: { isActive: false, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!result) {
        res.status(404).json({ message: "Book not found" });
        return;
      }

      res.json({ message: "Book removed successfully" });
    } catch (err) {
      console.error("Delete book error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
