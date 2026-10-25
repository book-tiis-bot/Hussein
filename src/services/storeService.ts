import { Book, Order, PaymentRequest, Profile, ReadingProgress } from '../types';
import { INITIAL_BOOKS, INITIAL_ORDERS, INITIAL_PAYMENT_REQUESTS, INITIAL_PROFILES } from './mockData';

const STORAGE_KEYS = {
  BOOKS: 'booktiis_books_v1',
  PROFILES: 'booktiis_profiles_v1',
  ORDERS: 'booktiis_orders_v1',
  PAYMENT_REQUESTS: 'booktiis_payments_v1',
  CURRENT_USER: 'booktiis_current_user_v1',
  READING_PROGRESS: 'booktiis_reading_progress_v1'
};

class StoreService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`Error reading localStorage for key ${key}:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing localStorage for key ${key}:`, e);
    }
  }

  public init() {
    // Purge legacy mock books if found in localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.some((b: any) => String(b.id).startsWith('b-10'))) {
          localStorage.removeItem(STORAGE_KEYS.BOOKS);
        }
      }
    } catch {
      // Ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.BOOKS)) {
      this.set(STORAGE_KEYS.BOOKS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      this.set(STORAGE_KEYS.PROFILES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      this.set(STORAGE_KEYS.ORDERS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENT_REQUESTS)) {
      this.set(STORAGE_KEYS.PAYMENT_REQUESTS, []);
    }
  }

  // Current logged in profile in local store
  public getCurrentProfile(): Profile | null {
    return this.get<Profile | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public setCurrentProfile(profile: Profile | null): void {
    this.set(STORAGE_KEYS.CURRENT_USER, profile);
  }

  // Books
  public getBooks(): Book[] {
    return this.get<Book[]>(STORAGE_KEYS.BOOKS, []);
  }

  public getBookById(id: string): Book | undefined {
    return this.getBooks().find((b) => b.id === id);
  }

  public saveBook(book: Book): Book {
    const books = this.getBooks();
    const index = books.findIndex((b) => b.id === book.id);
    if (index >= 0) {
      books[index] = { ...book };
    } else {
      books.unshift(book);
    }
    this.set(STORAGE_KEYS.BOOKS, books);
    return book;
  }

  public deleteBook(id: string): boolean {
    const books = this.getBooks().filter((b) => b.id !== id);
    this.set(STORAGE_KEYS.BOOKS, books);
    return true;
  }

  // Orders
  public getOrders(): Order[] {
    return this.get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  public getUserOrders(userId: string): Order[] {
    return this.getOrders().filter((o) => o.user_id === userId);
  }

  public createOrder(order: Order): Order {
    const orders = this.getOrders();
    orders.unshift(order);
    this.set(STORAGE_KEYS.ORDERS, orders);
    return order;
  }

  public updateOrderStatus(orderId: string, status: 'pending' | 'paid' | 'rejected'): boolean {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      this.set(STORAGE_KEYS.ORDERS, orders);
      return true;
    }
    return false;
  }

  // Payment Requests
  public getPaymentRequests(): PaymentRequest[] {
    return this.get<PaymentRequest[]>(STORAGE_KEYS.PAYMENT_REQUESTS, INITIAL_PAYMENT_REQUESTS);
  }

  public createPaymentRequest(req: PaymentRequest): PaymentRequest {
    const requests = this.getPaymentRequests();
    requests.unshift(req);
    this.set(STORAGE_KEYS.PAYMENT_REQUESTS, requests);
    return req;
  }

  public reviewPaymentRequest(
    requestId: string,
    status: 'approved' | 'rejected',
    reviewerId: string
  ): boolean {
    const requests = this.getPaymentRequests();
    const req = requests.find((r) => r.id === requestId);
    if (req) {
      req.status = status;
      req.reviewed_by = reviewerId;
      req.reviewed_at = new Date().toISOString();
      this.set(STORAGE_KEYS.PAYMENT_REQUESTS, requests);

      // If approved, update the order status to paid
      if (status === 'approved') {
        this.updateOrderStatus(req.order_id, 'paid');
      } else if (status === 'rejected') {
        this.updateOrderStatus(req.order_id, 'rejected');
      }
      return true;
    }
    return false;
  }

  // Profiles
  public getProfiles(): Profile[] {
    return this.get<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  public addProfile(profile: Profile): Profile {
    const profiles = this.getProfiles();
    profiles.push(profile);
    this.set(STORAGE_KEYS.PROFILES, profiles);
    return profile;
  }

  public updateProfile(profile: Profile): Profile {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
      this.set(STORAGE_KEYS.PROFILES, profiles);
    }
    return profile;
  }

  // Reading Progress
  public getReadingProgress(userId: string, bookId: string): ReadingProgress | null {
    const key = `${STORAGE_KEYS.READING_PROGRESS}_${userId}_${bookId}`;
    return this.get<ReadingProgress | null>(key, null);
  }

  public saveReadingProgress(progress: ReadingProgress): void {
    const key = `${STORAGE_KEYS.READING_PROGRESS}_${progress.user_id}_${progress.book_id}`;
    this.set(key, progress);
  }

  // Reset to original demo
  public resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENT_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.init();
  }
}

export const storeService = new StoreService();
storeService.init();
