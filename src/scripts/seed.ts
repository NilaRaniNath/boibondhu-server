import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import { hashPassword } from "../utils/auth";
import type { User, Book, Review } from "../types";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "boibondhu";

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log("Dropping existing collections...");
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.dropCollection(col.name);
    }

    console.log("Creating indexes...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("books").createIndex({ category: 1 });
    await db.collection("orders").createIndex({ userId: 1 });

    console.log("Seeding users...");
    const now = new Date();
    const adminPassword = await hashPassword("Admin@123");
    const userPassword = await hashPassword("User@123");

    const adminResult = await db.collection<User>("users").insertOne({
      name: "Admin Ferauni",
      email: "admin@ferauni.com",
      password: adminPassword,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    const userResult = await db.collection<User>("users").insertOne({
      name: "Rahim Uddin",
      email: "user@ferauni.com",
      password: userPassword,
      role: "user",
      createdAt: now,
      updatedAt: now,
    });

    console.log("Seeding books...");
    const books: Omit<Book, "_id">[] = [
      {
        title: "Pather Panchali",
        author: "Bibhutibhushan Bandyopadhyay",
        description:
          "The first novel in the Apu Trilogy, Pather Panchali paints a vivid portrait of rural Bengal in the early 20th century. Follow young Apu as he grows up amid poverty, nature, and the tender bonds of family. A masterpiece of world literature that captures the innocence and hardship of childhood with breathtaking lyricism.",
        price: 350,
        coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
        category: "Bengali Classic",
        condition: "new",
        stock: 25,
        totalSold: 0,
        rating: 4.8,
        numReviews: 342,
        isbn: "978-81-295-0386-4",
        pages: 320,
        language: "Bengali",
        publishedYear: 1929,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        description:
          "Set in the Jazz Age on Long Island, the novel depicts the mysterious millionaire Jay Gatsby and his obsessive pursuit of Daisy Buchanan. Fitzgerald's prose shimmers with the excess and disillusionment of the American Dream, crafting a story of love, wealth, and tragic ambition that remains eternally relevant.",
        price: 420,
        coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
        category: "Classic Fiction",
        condition: "new",
        stock: 40,
        totalSold: 0,
        rating: 4.6,
        numReviews: 891,
        isbn: "978-0-7432-7356-5",
        pages: 180,
        language: "English",
        publishedYear: 1925,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        description:
          "From the emergence of Homo sapiens in Africa to the present, Harari charts the entire sweep of human history. How did we go from insignificant apes to rulers of the world? This thought-provoking narrative weaves together biology, history, and economics to answer the biggest questions about our species.",
        price: 580,
        coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400",
        category: "Non-Fiction",
        condition: "new",
        stock: 35,
        totalSold: 0,
        rating: 4.5,
        numReviews: 1243,
        isbn: "978-0-06-231609-7",
        pages: 443,
        language: "English",
        publishedYear: 2011,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "A Game of Thrones",
        author: "George R.R. Martin",
        description:
          "In a land where summers can last decades and winters a lifetime, trouble is brewing. The cold is returning, and in the frozen wastes to the north of Winterfell, sinister forces are massing beyond the kingdom's protective Wall. A sweeping epic of power, betrayal, and ambition in a medieval fantasy world.",
        price: 650,
        coverImage: "https://images.unsplash.com/photo-1629992101753-56d196c8adf7?w=400",
        category: "Fantasy",
        condition: "new",
        stock: 30,
        totalSold: 0,
        rating: 4.7,
        numReviews: 2105,
        isbn: "978-0-553-57340-4",
        pages: 694,
        language: "English",
        publishedYear: 1996,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        description:
          "A revolutionary system to get 1 percent better every day. People think that change requires motivation, but Clear shows that the real key is building systems of tiny habits that compound over time. Packed with practical strategies backed by scientific research, this book will reshape how you think about progress.",
        price: 490,
        coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
        category: "Self-Help",
        condition: "new",
        stock: 50,
        totalSold: 0,
        rating: 4.8,
        numReviews: 3200,
        isbn: "978-0-7352-1129-2",
        pages: 320,
        language: "English",
        publishedYear: 2018,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Gitanjali",
        author: "Rabindranath Tagore",
        description:
          "The English translation of Tagore's profound collection of devotional poems brought him the Nobel Prize in Literature in 1913. These poems explore the relationship between the human soul and the divine with haunting beauty and spiritual depth, cementing Tagore's place as one of the greatest poets of all time.",
        price: 280,
        coverImage: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
        category: "Poetry",
        condition: "new",
        stock: 20,
        totalSold: 0,
        rating: 4.7,
        numReviews: 567,
        isbn: "978-81-295-0476-8",
        pages: 154,
        language: "Bengali",
        publishedYear: 1910,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        description:
          "Nobel laureate Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think. System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical. Understanding these systems reveals why we often make irrational decisions.",
        price: 520,
        coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
        category: "Non-Fiction",
        condition: "new",
        stock: 28,
        totalSold: 0,
        rating: 4.6,
        numReviews: 1876,
        isbn: "978-0-374-53355-7",
        pages: 499,
        language: "English",
        publishedYear: 2011,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        description:
          "Bilbo Baggins is a hobbit who enjoys a comfortable life, rarely traveling far from home. His contentment is disturbed by the wizard Gandalf and a company of dwarves who arrive to recruit him as their burglar. A timeless adventure through Middle-earth that launched one of the greatest fantasy epics ever told.",
        price: 450,
        coverImage: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400",
        category: "Fantasy",
        condition: "new",
        stock: 45,
        totalSold: 0,
        rating: 4.9,
        numReviews: 4500,
        isbn: "978-0-547-92822-7",
        pages: 310,
        language: "English",
        publishedYear: 1937,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Homo Deus: A Brief History of Tomorrow",
        author: "Yuval Noah Harari",
        description:
          "Having explored our past and present, Harari turns his gaze to the future. What will happen to society when artificial intelligence surpasses human intelligence? What happens when biotechnology enables us to upgrade humans into gods? A provocative and daring look at what lies ahead for humanity.",
        price: 550,
        coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
        category: "Non-Fiction",
        condition: "new",
        stock: 32,
        totalSold: 0,
        rating: 4.5,
        numReviews: 1567,
        isbn: "978-0-06-246431-6",
        pages: 449,
        language: "English",
        publishedYear: 2015,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Devdas",
        author: "Sarat Chandra Chattopadhyay",
        description:
          "One of the most acclaimed works in Bengali literature, Devdas is the tragic tale of a young man who returns home after years away to find the woman he loves has been married off to another. His descent into alcoholism and despair has been adapted into numerous films and remains a powerful story of lost love.",
        price: 250,
        coverImage: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400",
        category: "Bengali Classic",
        condition: "used",
        stock: 22,
        totalSold: 0,
        rating: 4.6,
        numReviews: 423,
        isbn: "978-81-7756-220-0",
        pages: 200,
        language: "Bengali",
        publishedYear: 1917,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const bookResult = await db.collection<Book>("books").insertMany(books);
    const bookIds = Object.values(bookResult.insertedIds);

    console.log("Seeding reviews...");
    const reviews: Omit<Review, "_id">[] = [
      {
        userId: userResult.insertedId,
        bookId: bookIds[0]!,
        rating: 5,
        comment:
          "An absolute masterpiece. Bandyopadhyay's description of rural Bengal made me feel the monsoon winds. Every page is alive with emotion.",
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: userResult.insertedId,
        bookId: bookIds[2]!,
        rating: 5,
        comment:
          "Changed my perspective on human history. Harari connects dots I never even noticed. Required reading for anyone who wants to understand where we came from.",
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: adminResult.insertedId,
        bookId: bookIds[8]!,
        rating: 5,
        comment:
          "Harari does it again. If Sapiens made you question the past, Homo Deus will make you question the future. Both terrifying and fascinating.",
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.collection<Review>("reviews").insertMany(reviews);

    console.log("\n--- Seed Complete ---");
    console.log(`Users: 2 (admin@ferauni.com / Admin@123, user@ferauni.com / User@123)`);
    console.log(`Books: ${books.length}`);
    console.log(`Reviews: ${reviews.length}`);
    console.log(`Indexes: users.email (unique), books.category, orders.userId`);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
