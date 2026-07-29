import { Router, Request, Response } from "express";
import { getDB } from "../lib/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import type { Book, Order } from "../types";

const router = Router();

router.get("/stats", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDB();
    const usersCol = db.collection("users");
    const booksCol = db.collection<Book>("books");
    const ordersCol = db.collection<Order>("orders");

    const [totalUsers, totalBooks, totalOrders, revenueResult, categoryDistribution, monthlySales] =
      await Promise.all([
        usersCol.countDocuments(),
        booksCol.countDocuments({ isActive: true }),
        ordersCol.countDocuments(),
        ordersCol
          .aggregate([
            { $match: { status: { $in: ["confirmed", "delivered"] } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ])
          .toArray(),
        booksCol
          .aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ])
          .toArray(),
        ordersCol
          .aggregate([
            { $match: { status: { $in: ["confirmed", "delivered"] } } },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                revenue: { $sum: "$totalAmount" },
                orders: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            { $limit: 12 },
          ])
          .toArray(),
      ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0]!.total : 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const formattedMonthlySales = monthlySales.map((m) => ({
      month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      revenue: m.revenue,
      orders: m.orders,
    }));

    res.json({
      totalRevenue,
      totalOrders,
      totalBooks,
      totalUsers,
      categoryDistribution,
      monthlySales: formattedMonthlySales,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDB();

    const users = await db
      .collection("users")
      .aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "userId",
            as: "orders",
          },
        },
        {
          $addFields: {
            totalOrders: { $size: "$orders" },
            totalSpent: { $sum: "$orders.totalAmount" },
          },
        },
        {
          $project: {
            password: 0,
            orders: 0,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.json(users);
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
