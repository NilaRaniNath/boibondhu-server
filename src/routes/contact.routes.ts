import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDB } from "../lib/db";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const db = await getDB();
    await db.collection("contacts").insertOne({
      ...parsed.data,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Message received. We'll get back to you within 24 hours." });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
