import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { AdminStats, Book, Order, PaymentRequest, ReadingProgress } from '../types';
import { bookService } from './bookService';
import { storeService } from './storeService';

export const EVC_PLUS_NUMBER = '0613424271';
export const EVC_PLUS_INSTRUCTIONS =
  'Fadlan lacagta ugu dir lambarka EVC Plus ee kore (0613424271). Kadib geli Transaction ID-gaaga oo gudbi codsiga. Buugga waxaa laguu furayaa marka maamulka xaqiijiyo lacagta.';

class OrderService {
  // Check if user has access to a specific book
  public async hasAccess(userId: string | undefined, book: Book, userRole?: string): Promise<boolean> {
    if (userRole === 'admin') return true;
    if (book.is_free) return true;
    if (!userId) return false;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, status')
          .eq('user_id', userId)
          .eq('book_id', book.id)
          .eq('status', 'paid')
          .maybeSingle();

        if (!error && data) {
          return true;
        }
      } catch (e) {
        console.error('Error checking book access in Supabase:', e);
      }
    }

    // Local mode check
    const userOrders = storeService.getUserOrders(userId);
    return userOrders.some(o => o.book_id === book.id && o.status === 'paid');
  }

  // Get user order for a book if any exists
  public async getUserOrderForBook(userId: string, bookId: string): Promise<Order | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .eq('book_id', bookId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) return data as Order;
      } catch (e) {
        console.error('Error getting order in Supabase:', e);
      }
    }

    const orders = storeService.getUserOrders(userId);
    return orders.find(o => o.book_id === bookId) || null;
  }

  // Create a pending order for a book
  public async createOrder(userId: string, book: Book): Promise<{ success: boolean; order?: Order; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        // First check if pending or paid order already exists
        const existing = await this.getUserOrderForBook(userId, book.id);
        if (existing && existing.status === 'paid') {
          return { success: true, order: existing };
        }
        if (existing && existing.status === 'pending') {
          return { success: true, order: existing };
        }

        const { data, error } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            book_id: book.id,
            amount: book.price,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, order: data as Order };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay';
        return { success: false, error: msg };
      }
    }

    // Local mode
    const existing = await this.getUserOrderForBook(userId, book.id);
    if (existing) {
      return { success: true, order: existing };
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      user_id: userId,
      book_id: book.id,
      amount: book.price,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    storeService.createOrder(newOrder);
    return { success: true, order: newOrder };
  }

  // Submit EVC Plus payment transaction reference
  public async submitPayment(
    orderId: string,
    userId: string,
    transactionReference: string
  ): Promise<{ success: boolean; paymentRequest?: PaymentRequest; error?: string }> {
    if (!transactionReference || transactionReference.trim().length < 4) {
      return { success: false, error: 'Fadlan geli Transaction ID sax ah oo aad ka heshay EVC Plus.' };
    }

    const ref = transactionReference.trim();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .insert({
            order_id: orderId,
            user_id: userId,
            transaction_reference: ref,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, paymentRequest: data as PaymentRequest };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay';
        return { success: false, error: msg };
      }
    }

    // Local mode
    const newReq: PaymentRequest = {
      id: `pay-${Date.now()}`,
      order_id: orderId,
      user_id: userId,
      transaction_reference: ref,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    storeService.createPaymentRequest(newReq);
    return { success: true, paymentRequest: newReq };
  }

  // Get user's orders with full details
  public async getUserOrders(userId: string): Promise<Order[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            book:books (*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as Order[];
        }
      } catch (e) {
        console.error('Error fetching user orders from Supabase:', e);
      }
    }

    // Local mode
    const orders = storeService.getUserOrders(userId);
    return orders.map(o => {
      const book = storeService.getBookById(o.book_id);
      return { ...o, book };
    });
  }

  // Get user's payment requests
  public async getUserPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .select(`
            *,
            order:orders (
              *,
              book:books (*)
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as PaymentRequest[];
        }
      } catch (e) {
        console.error('Error fetching user payment requests from Supabase:', e);
      }
    }

    const reqs = storeService.getPaymentRequests().filter(r => r.user_id === userId);
    return reqs.map(r => {
      const order = storeService.getOrders().find(o => o.id === r.order_id);
      const book = order ? storeService.getBookById(order.book_id) : undefined;
      return { ...r, order, book };
    });
  }

  // Get user's library: free books + paid books with verified status
  public async getUserLibraryBooks(userId: string | undefined): Promise<Book[]> {
    const res = await bookService.getBooks({ onlyPublished: true });
    const allBooks = res.books || [];
    if (!userId) {
      return allBooks.filter(b => b.is_free);
    }

    const userOrders = await this.getUserOrders(userId);
    const paidBookIds = new Set(userOrders.filter(o => o.status === 'paid').map(o => o.book_id));

    return allBooks.filter(b => b.is_free || paidBookIds.has(b.id));
  }

  // Admin: Get all payment requests
  public async getAllPaymentRequests(): Promise<PaymentRequest[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .select(`
            *,
            order:orders (
              *,
              book:books (*)
            ),
            user:profiles (*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as PaymentRequest[];
        }
      } catch (e) {
        console.error('Error fetching admin payments in Supabase:', e);
      }
    }

    // Local mode
    const requests = storeService.getPaymentRequests();
    const orders = storeService.getOrders();
    const profiles = storeService.getProfiles();
    const books = storeService.getBooks();

    return requests.map(req => {
      const order = orders.find(o => o.id === req.order_id);
      const book = order ? books.find(b => b.id === order.book_id) : undefined;
      const user = profiles.find(p => p.id === req.user_id);
      return {
        ...req,
        order,
        book,
        user
      };
    });
  }

  // Admin: Approve or Reject a payment
  public async reviewPayment(
    requestId: string,
    action: 'approved' | 'rejected',
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        // Fetch payment request to get order_id
        const { data: req, error: fetchErr } = await supabase
          .from('payment_requests')
          .select('order_id')
          .eq('id', requestId)
          .single();

        if (fetchErr || !req) throw new Error('Codsiga lama helin');

        // Update payment request
        const { error: reqError } = await supabase
          .from('payment_requests')
          .update({
            status: action,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (reqError) throw reqError;

        // Update order status accordingly
        const orderStatus = action === 'approved' ? 'paid' : 'rejected';
        const { error: ordError } = await supabase
          .from('orders')
          .update({ status: orderStatus })
          .eq('id', req.order_id);

        if (ordError) throw ordError;

        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay xilligii xaqiijinta';
        return { success: false, error: msg };
      }
    }

    // Local mode
    const ok = storeService.reviewPaymentRequest(requestId, action, adminId);
    return { success: ok };
  }

  // Admin: Statistics
  public async getAdminStats(): Promise<AdminStats> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const [booksRes, profilesRes, ordersRes, paymentsRes] = await Promise.all([
          supabase.from('books').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('amount, status'),
          supabase.from('payment_requests').select('id, status')
        ]);

        const totalBooks = booksRes.count || 0;
        const totalCustomers = profilesRes.count || 0;
        const orders = ordersRes.data || [];
        const totalOrders = orders.length;
        const verifiedSales = orders
          .filter(o => o.status === 'paid')
          .reduce((sum, o) => sum + Number(o.amount || 0), 0);
        const pendingRequests = (paymentsRes.data || []).filter(p => p.status === 'pending').length;

        return {
          totalBooks,
          totalCustomers,
          totalOrders,
          verifiedSales,
          pendingRequests
        };
      } catch (e) {
        console.error('Error fetching admin stats from Supabase:', e);
      }
    }

    // Local mode stats
    const books = storeService.getBooks();
    const profiles = storeService.getProfiles();
    const orders = storeService.getOrders();
    const payments = storeService.getPaymentRequests();

    const totalBooks = books.length;
    const totalCustomers = profiles.length;
    const totalOrders = orders.length;
    const verifiedSales = orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    const pendingRequests = payments.filter(p => p.status === 'pending').length;

    return {
      totalBooks,
      totalCustomers,
      totalOrders,
      verifiedSales,
      pendingRequests
    };
  }

  // Reading progress
  public async saveReadingProgress(userId: string, bookId: string, page: number, totalPages: number): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('reading_progress').upsert({
          user_id: userId,
          book_id: bookId,
          last_page: page,
          total_pages: totalPages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,book_id' });
      } catch (e) {
        console.error('Error saving reading progress:', e);
      }
    }

    storeService.saveReadingProgress({
      user_id: userId,
      book_id: bookId,
      last_page: page,
      total_pages: totalPages,
      updated_at: new Date().toISOString()
    });
  }

  public async getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('book_id', bookId)
          .maybeSingle();

        if (data) return data as ReadingProgress;
      } catch (e) {
        console.error('Error fetching reading progress:', e);
      }
    }

    return storeService.getReadingProgress(userId, bookId);
  }
}

export const orderService = new OrderService();
