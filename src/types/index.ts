import { ObjectId } from "mongodb";

export type UserRole = "user" | "admin";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type BookCondition = "new" | "like_new" | "used";

export interface Book {
  _id?: ObjectId;
  title: string;
  author: string;
  description: string;
  price: number;
  coverImage: string;
  images?: string[];
  category: string;
  condition: BookCondition;
  stock: number;
  totalSold: number;
  rating: number;
  numReviews: number;
  isbn?: string;
  pages: number;
  language: string;
  publishedYear: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  bookId: ObjectId;
  title: string;
  price: number;
  quantity: number;
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export interface Order {
  _id?: ObjectId;
  userId: ObjectId;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  _id?: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
