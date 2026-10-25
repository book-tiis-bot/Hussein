export type Role = 'customer' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at?: string;
  email?: string;
}

export type BookCategory =
  | 'Diinta'
  | 'Taariikh'
  | 'Ganacsiga'
  | 'Cilmi'
  | 'Suugaanta'
  | 'Teknoolojiga'
  | 'Caafimaadka';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: BookCategory | string;
  cover_path: string;
  pdf_path: string;
  price: number;
  is_free: boolean;
  is_published: boolean;
  created_at: string;
  pages_count?: number;
  featured?: boolean;
  sample_content?: string[];
}

export type OrderStatus = 'pending' | 'paid' | 'rejected';

export interface Order {
  id: string;
  user_id: string;
  book_id: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  book?: Book;
  user?: Profile;
}

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  order_id: string;
  user_id: string;
  transaction_reference: string;
  status: PaymentRequestStatus;
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
  order?: Order;
  book?: Book;
  user?: Profile;
}

export interface ReadingProgress {
  id?: string;
  user_id: string;
  book_id: string;
  last_page: number;
  total_pages: number;
  updated_at: string;
}

export interface AdminStats {
  totalBooks: number;
  totalCustomers: number;
  totalOrders: number;
  verifiedSales: number;
  pendingRequests: number;
}
