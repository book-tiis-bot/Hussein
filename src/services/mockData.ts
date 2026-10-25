import { Book, Order, PaymentRequest, Profile } from '../types';

// Production configuration: Empty arrays to ensure Supabase is the single source of truth.
// No hardcoded sample books, mock arrays, or fake demo prices.
export const INITIAL_BOOKS: Book[] = [];

export const INITIAL_PROFILES: Profile[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_PAYMENT_REQUESTS: PaymentRequest[] = [];
