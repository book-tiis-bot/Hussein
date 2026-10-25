import { supabase } from '../lib/supabase';
import { Book } from '../types';

export interface BookServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  isRlsError?: boolean;
}

class BookService {
  /**
   * Fetch all available books from Supabase books table
   * Source of truth is the Supabase database.
   */
  public async getBooks(filters?: {
    category?: string;
    is_free?: boolean;
    search?: string;
    onlyPublished?: boolean;
  }): Promise<{ books: Book[]; error?: string }> {
    try {
      let query = supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.onlyPublished !== false) {
        query = query.eq('is_published', true);
      }
      if (filters?.category && filters.category !== 'Dhammaan') {
        query = query.eq('category', filters.category);
      }
      if (filters?.is_free !== undefined) {
        query = query.eq('is_free', filters.is_free);
      }
      if (filters?.search && filters.search.trim() !== '') {
        const s = filters.search.trim().toLowerCase();
        query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%,description.ilike.%${s}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching books from Supabase:', error);
        return {
          books: [],
          error: `Cillad Supabase: ${error.message} (${error.code || ''})`
        };
      }

      const booksList: Book[] = (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        author: row.author,
        category: row.category,
        description: row.description || '',
        cover_path: row.cover_path || '',
        pdf_path: row.pdf_path || '',
        price: Number(row.price || 0),
        is_free: Boolean(row.is_free),
        is_published: Boolean(row.is_published ?? true),
        created_at: row.created_at || new Date().toISOString(),
        pages_count: row.pages_count || 120,
        sample_content: row.sample_content,
        featured: Boolean(row.featured)
      }));

      return { books: booksList };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad aan la garanayn ayaa dhacay';
      console.error('Exception in getBooks:', err);
      return { books: [], error: msg };
    }
  }

  /**
   * Get single book by ID directly from Supabase
   */
  public async getBookById(id: string): Promise<Book | null> {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        author: data.author,
        category: data.category,
        description: data.description || '',
        cover_path: data.cover_path || '',
        pdf_path: data.pdf_path || '',
        price: Number(data.price || 0),
        is_free: Boolean(data.is_free),
        is_published: Boolean(data.is_published ?? true),
        created_at: data.created_at,
        pages_count: data.pages_count,
        sample_content: data.sample_content
      };
    } catch (e) {
      console.error('Error fetching book by ID:', e);
      return null;
    }
  }

  /**
   * Save a book directly to Supabase books table (Insert or Update)
   * With explicit post-save verification to ensure the database record
   * is strictly saved and verified before returning success.
   */
  public async saveBook(
    bookData: Partial<Book> & { title: string; author: string; category: string }
  ): Promise<BookServiceResponse<Book>> {
    if (!bookData.title || !bookData.title.trim()) {
      return { success: false, error: 'Fadlan geli magaca buugga (Title).' };
    }
    if (!bookData.author || !bookData.author.trim()) {
      return { success: false, error: 'Fadlan geli qoraaga buugga (Author).' };
    }

    const isFree = Boolean(bookData.is_free || Number(bookData.price) === 0);
    const price = isFree ? 0 : Number(bookData.price || 0);

    const payload = {
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      category: bookData.category,
      description: bookData.description?.trim() || '',
      cover_path: bookData.cover_path?.trim() || '',
      pdf_path: bookData.pdf_path?.trim() || '',
      price: price,
      is_free: isFree,
      is_published: bookData.is_published ?? true,
    };

    try {
      let savedId: string;

      if (bookData.id && !bookData.id.startsWith('b-')) {
        // Update existing row in Supabase
        const { data, error } = await supabase
          .from('books')
          .update(payload)
          .eq('id', bookData.id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update book error:', error);
          const isRls = error.code === '42501' || error.message.includes('row-level security');
          return {
            success: false,
            error: isRls
              ? 'Xeerka Amniga Supabase (RLS): Fasax uma haysid cusboonaysiinta buuggan. Hubi in koontadaada lagu xaqiijiyay doorka "admin" table-ka profiles.'
              : `Khalad: ${error.message}`,
            isRlsError: isRls
          };
        }

        savedId = data.id;
      } else {
        // Insert new row into Supabase
        const { data, error } = await supabase
          .from('books')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error('Supabase insert book error:', error);
          const isRls = error.code === '42501' || error.message.includes('row-level security');
          return {
            success: false,
            error: isRls
              ? 'Xeerka Amniga Supabase (RLS): Fasax uma haysid gelinta buuggan. Hubi in koontadaada lagu xaqiijiyay doorka "admin" table-ka profiles.'
              : `Khalad: ${error.message}`,
            isRlsError: isRls
          };
        }

        savedId = data.id;
      }

      // Step 5: Post-save verification - fetch the saved database record by ID
      const { data: verified, error: verifyErr } = await supabase
        .from('books')
        .select('*')
        .eq('id', savedId)
        .single();

      if (verifyErr || !verified) {
        console.error('Post-save verification failed:', verifyErr);
        return {
          success: false,
          error: 'Buugga si toos ah looma xaqiijin karo xog-kaydka Supabase ka dib kaydinta.'
        };
      }

      const verifiedBook: Book = {
        id: verified.id,
        title: verified.title,
        author: verified.author,
        category: verified.category,
        description: verified.description || '',
        cover_path: verified.cover_path || '',
        pdf_path: verified.pdf_path || '',
        price: Number(verified.price || 0),
        is_free: Boolean(verified.is_free),
        is_published: Boolean(verified.is_published ?? true),
        created_at: verified.created_at || new Date().toISOString(),
      };

      return { success: true, data: verifiedBook };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa ka dhacay kaydinta buugga';
      console.error('Exception in saveBook:', err);
      return { success: false, error: msg };
    }
  }

  /**
   * Delete book directly from Supabase books table
   */
  public async deleteBook(id: string): Promise<BookServiceResponse> {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete book error:', error);
        const isRls = error.code === '42501' || error.message.includes('row-level security');
        return {
          success: false,
          error: isRls
            ? 'Xeerka Amniga Supabase (RLS): Fasax uma haysid tirista buuggan. Hubi RLS policy-ga "books".'
            : error.message,
          isRlsError: isRls
        };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay';
      return { success: false, error: msg };
    }
  }

  /**
   * Upload cover image to public 'book-covers' bucket in Supabase Storage.
   * Generates a unique filename to prevent overwriting other books.
   */
  public async uploadCoverImage(
    file: File
  ): Promise<{ success: boolean; url?: string; path?: string; error?: string; isRlsError?: boolean }> {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = cleanFileName;

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) {
        console.error('Storage upload cover error:', uploadError);
        const isRls =
          uploadError.message.includes('row-level security') ||
          (uploadError as any).statusCode === '403' ||
          (uploadError as any).code === 'AccessDenied';

        return {
          success: false,
          error: isRls
            ? 'Supabase Storage RLS: Fasax uma haysid gelinta sawirka bucket-ka "book-covers".'
            : `Khalad ku yimid gelinta sawirka: ${uploadError.message}`,
          isRlsError: isRls
        };
      }

      // Generate public URL for public bucket
      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl, path: filePath };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa ka dhacay gelinta sawirka';
      return { success: false, error: msg };
    }
  }

  /**
   * Upload PDF file to private 'book-pdfs' bucket in Supabase Storage.
   * Generates a unique filename for each PDF.
   */
  public async uploadPdfFile(
    file: File
  ): Promise<{ success: boolean; path?: string; error?: string; isRlsError?: boolean }> {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const cleanFileName = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = cleanFileName;

      const { error: uploadError } = await supabase.storage
        .from('book-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        });

      if (uploadError) {
        console.error('Storage upload pdf error:', uploadError);
        const isRls =
          uploadError.message.includes('row-level security') ||
          (uploadError as any).statusCode === '403' ||
          (uploadError as any).code === 'AccessDenied';

        return {
          success: false,
          error: isRls
            ? 'Supabase Storage RLS: Fasax uma haysid gelinta PDF-ka bucket-ka "book-pdfs".'
            : `Khalad ku yimid gelinta PDF-ka: ${uploadError.message}`,
          isRlsError: isRls
        };
      }

      // Store the relative storage path in the books table
      return { success: true, path: filePath };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa ka dhacay gelinta faylka PDF-ka';
      return { success: false, error: msg };
    }
  }

  /**
   * Generate short-lived signed URL for private book PDF from 'book-pdfs' bucket
   */
  public async getSecurePdfUrl(pdfPath: string): Promise<string | null> {
    try {
      if (!pdfPath || !pdfPath.trim()) return null;

      const clean = pdfPath.trim();

      // If it's a full URL already (e.g. external or already signed)
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:')) {
        return clean;
      }

      // Sanitize path: strip leading slashes or bucket prefix
      const sanitized = clean.replace(/^(\/)?(book-pdfs\/)?/, '');

      const { data, error } = await supabase.storage
        .from('book-pdfs')
        .createSignedUrl(sanitized, 3600);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
      if (error) {
        console.error('Error generating signed URL for PDF:', error);
      }
    } catch (e) {
      console.error('Exception generating signed URL for PDF:', e);
    }
    return null;
  }
}

export const bookService = new BookService();
