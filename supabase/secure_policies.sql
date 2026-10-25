-- ====================================================================
-- BOOK-TIIS: SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- Strict, production-grade authorization without unrestricted policies
-- Compatible with existing Supabase tables (profiles, books, orders, payment_requests)
-- ====================================================================

-- 1. SECURITY DEFINER HELPER: Check if current user is an admin
-- Bypasses profiles RLS recursion safely using SET search_path = public
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- 2. SECURITY DEFINER HELPER: Check if current user has access to a book PDF
-- Ensures customers can access a PDF ONLY if:
--   a) They are an administrator
--   b) The book is free and published
--   c) Their purchase order has been verified and approved as 'paid' by an admin
CREATE OR REPLACE FUNCTION public.can_access_book_pdf(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Admin has full access
    public.is_admin()
    OR
    -- Free and published book
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.pdf_path = object_name
        AND b.is_free = true
        AND b.is_published = true
    )
    OR
    -- Authenticated customer with a verified paid order
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.books b ON o.book_id = b.id
      WHERE b.pdf_path = object_name
        AND o.user_id = auth.uid()
        AND o.status = 'paid'
    )
  );
$$;

-- ====================================================================
-- 3. SECURE POLICIES FOR public.books TABLE
-- ====================================================================
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Clean up any old/loose policies
DROP POLICY IF EXISTS "Anyone can view published books" ON public.books;
DROP POLICY IF EXISTS "Customers can only read published books" ON public.books;
DROP POLICY IF EXISTS "Allow all for books" ON public.books;
DROP POLICY IF EXISTS "Allow manage books" ON public.books;
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;
DROP POLICY IF EXISTS "Only authenticated admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Only authenticated admins can update books" ON public.books;
DROP POLICY IF EXISTS "Only authenticated admins can delete books" ON public.books;

-- A. Customers can ONLY read published books (Admins can view both published and drafts)
CREATE POLICY "Customers can only read published books"
ON public.books FOR SELECT
USING (is_published = true OR public.is_admin());

-- B. Only authenticated administrators can add books
CREATE POLICY "Only authenticated admins can insert books"
ON public.books FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- C. Only authenticated administrators can edit books
CREATE POLICY "Only authenticated admins can update books"
ON public.books FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- D. Only authenticated administrators can delete books
CREATE POLICY "Only authenticated admins can delete books"
ON public.books FOR DELETE
TO authenticated
USING (public.is_admin());


-- ====================================================================
-- 4. SECURE POLICIES FOR STORAGE OBJECTS (book-covers & book-pdfs)
-- ====================================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up old storage policies
DROP POLICY IF EXISTS "Public can view book covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view book covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update book covers" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete book covers" ON storage.objects;

DROP POLICY IF EXISTS "Allow all for book-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow read book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users with access can view book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Verified purchasers and admins can access book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete book PDFs" ON storage.objects;

-- --- BUCKET: book-covers (Public view, Admin-only write) ---
CREATE POLICY "Anyone can view book covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

CREATE POLICY "Only admins can upload book covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-covers' AND public.is_admin());

CREATE POLICY "Only admins can update book covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'book-covers' AND public.is_admin())
WITH CHECK (bucket_id = 'book-covers' AND public.is_admin());

CREATE POLICY "Only admins can delete book covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'book-covers' AND public.is_admin());

-- --- BUCKET: book-pdfs (Private, Admin-only write, verified purchaser read) ---
-- Verified purchasers (status = 'paid') or admins can read authorized PDFs
CREATE POLICY "Verified purchasers and admins can access book PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-pdfs' AND public.can_access_book_pdf(name));

CREATE POLICY "Only admins can upload book PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-pdfs' AND public.is_admin());

CREATE POLICY "Only admins can update book PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'book-pdfs' AND public.is_admin())
WITH CHECK (bucket_id = 'book-pdfs' AND public.is_admin());

CREATE POLICY "Only admins can delete book PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'book-pdfs' AND public.is_admin());


-- ====================================================================
-- 5. SECURE POLICIES FOR public.orders TABLE
-- ====================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders or admin view all" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders or admins view all" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can update orders status" ON public.orders;

-- Customers can view only their own orders; admins can view all orders
CREATE POLICY "Users can view own orders or admins view all"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Customers can create their own pending orders
CREATE POLICY "Users can create own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only verified administrators can change order status (e.g. approve to 'paid' or 'rejected')
CREATE POLICY "Only admins can update orders status"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ====================================================================
-- 6. SECURE POLICIES FOR public.payment_requests TABLE
-- ====================================================================
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own payment requests or admins view all" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can submit payment requests for their orders" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can submit payment requests for own orders" ON public.payment_requests;
DROP POLICY IF EXISTS "Only admins can review payment requests" ON public.payment_requests;

-- Customers can view their own payment requests; admins can view all
CREATE POLICY "Users view own payment requests or admins view all"
ON public.payment_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Customers can submit payment requests for their own orders
CREATE POLICY "Users can submit payment requests for own orders"
ON public.payment_requests FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

-- Only administrators can approve or reject payment requests
CREATE POLICY "Only admins can review payment requests"
ON public.payment_requests FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ====================================================================
-- 7. SECURE POLICIES FOR public.profiles TABLE
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile without role elevation" ON public.profiles;

-- Users can view their own profile; admins can view all profiles
CREATE POLICY "Users view own profile or admins view all"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- Users can insert their own customer profile record (or admin can insert)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND (
    public.is_admin() OR role = 'customer'
  )
);

-- Users can update their profile information, but CANNOT elevate their role to 'admin'
CREATE POLICY "Users update own profile without role elevation"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    public.is_admin() OR role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  )
);
