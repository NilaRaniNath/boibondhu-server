import { Router, Request, Response } from "express";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDB } from "../lib/db";
import { requireAuth } from "../middlewares/auth";
import type { Review, Order } from "../types";

const router = Router();

const createReviewSchema = z.object({
  bookId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

router.get("/:bookId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params as { bookId: string };

    if (!ObjectId.isValid(bookId)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const db = await getDB();
    const reviews = await db
      .collection<Review>("reviews")
      .aggregate([
        { $match: { bookId: new ObjectId(bookId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { name: 1, email: 1 } }],
          },
        },
        { $unwind: "$user" },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { bookId, rating, comment } = parsed.data;
    const userId = new ObjectId(req.user!.userId);

    if (!ObjectId.isValid(bookId)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const db = await getDB();
    const ordersCol = db.collection<Order>("orders");
    const reviewsCol = db.collection<Review>("reviews");
    const booksCol = db.collection("books");

    const hasDeliveredOrder = await ordersCol.findOne({
      userId,
      "items.bookId": new ObjectId(bookId),
      status: "delivered",
    });

    if (!hasDeliveredOrder) {
      res.status(403).json({
        message: "You can only review books from delivered orders",
      });
      return;
    }

    const existingReview = await reviewsCol.findOne({
      userId,
      bookId: new ObjectId(bookId),
    });

    if (existingReview) {
      res.status(409).json({ message: "You have already reviewed this book" });
      return;
    }

    const now = new Date();
    const result = await reviewsCol.insertOne({
      userId,
      bookId: new ObjectId(bookId),
      rating,
      comment,
      createdAt: now,
      updatedAt: now,
    });

    const bookReviews = await reviewsCol
      .find({ bookId: new ObjectId(bookId) })
      .toArray();

    const avgRating =
      bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;

    await booksCol.updateOne(
      { _id: new ObjectId(bookId) },
      {
        $set: {
          rating: Math.round(avgRating * 10) / 10,
          numReviews: bookReviews.length,
          updatedAt: now,
        },
      }
    );

    const review = await reviewsCol.findOne({ _id: result.insertedId });

    res.status(201).json(review);
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
