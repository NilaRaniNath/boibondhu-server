import { Router, Request, Response } from "express";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDB } from "../lib/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import type { Order, OrderStatus, Book } from "../types";

const router = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }),
  paymentMethod: z.string().min(1),
});

router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { items, shippingAddress, paymentMethod } = parsed.data;
    const db = getDB();
    const booksCol = db.collection<Book>("books");
    const ordersCol = db.collection<Order>("orders");

    const bookIds = items.map((item) => new ObjectId(item.bookId));
    const books = await booksCol.find({ _id: { $in: bookIds }, isActive: true }).toArray();

    if (books.length !== items.length) {
      res.status(400).json({ message: "One or more books not found or unavailable" });
      return;
    }

    const bookMap = new Map(books.map((b) => [b._id!.toString(), b]));

    const orderItems: Order["items"] = [];
    let totalAmount = 0;

    for (const item of items) {
      const book = bookMap.get(item.bookId)!;

      if (book.stock < item.quantity) {
        res.status(400).json({
          message: `Insufficient stock for "${book.title}". Available: ${book.stock}`,
        });
        return;
      }

      orderItems.push({
        bookId: book._id!,
        title: book.title,
        price: book.price,
        quantity: item.quantity,
      });

      totalAmount += book.price * item.quantity;
    }

    const session = db.client.startSession();

    try {
      await session.withTransaction(async () => {
        for (const item of items) {
          const book = bookMap.get(item.bookId)!;
          const result = await booksCol.findOneAndUpdate(
            { _id: book._id!, stock: { $gte: item.quantity } },
            {
              $inc: { stock: -item.quantity, totalSold: item.quantity },
              $set: { updatedAt: new Date() },
            },
            { session }
          );

          if (!result) {
            throw new Error(`Insufficient stock for "${book.title}"`);
          }
        }

        const now = new Date();
        await ordersCol.insertOne(
          {
            userId: new ObjectId(req.user!.userId),
            items: orderItems,
            shippingAddress,
            totalAmount,
            status: "pending",
            paymentMethod,
            createdAt: now,
            updatedAt: now,
          },
          { session }
        );
      });

      res.status(201).json({ message: "Order placed successfully", totalAmount });
    } finally {
      await session.endSession();
    }
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDB();
    const orders = await db
      .collection<Order>("orders")
      .find({ userId: new ObjectId(req.user!.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(orders);
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDB();

    const orders = await db
      .collection<Order>("orders")
      .aggregate([
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

    res.json(orders);
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status?: string };

      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid order ID" });
        return;
      }

      const validStatuses: OrderStatus[] = ["pending", "confirmed", "delivered", "cancelled"];
      if (!status || !validStatuses.includes(status as OrderStatus)) {
        res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
        return;
      }

      const db = getDB();
      const result = await db.collection<Order>("orders").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: status as OrderStatus, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!result) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.json(result);
    } catch (err) {
      console.error("Update order status error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
