-- ====================================================================
-- BOOK-TIIS DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Brand: BOOK-TIIS | Maktabaddaada Dijitaalka ah (Your Digital Library)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
-- References auth.users, stores customer details and role
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cover_path TEXT,
    pdf_path TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_free BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status order_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PAYMENT REQUESTS TABLE (EVC PLUS)
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_reference TEXT NOT NULL,
    status payment_request_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 7. READING PROGRESS TABLE (Helper for remembering reading position)
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    last_page INT NOT NULL DEFAULT 1,
    total_pages INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id)
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_is_free ON public.books(is_free);
CREATE INDEX IF NOT EXISTS idx_books_published ON public.books(is_published);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_book_id ON public.orders(book_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_order_id ON public.payment_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);

-- 9. HELPER FUNCTIONS FOR SECURITY
-- Check if the current user is an admin (Security Definer with safe search_path)
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

-- Check if user can access a book PDF file in storage
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
    -- Free & published book
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.pdf_path = object_name
        AND b.is_free = true
        AND b.is_published = true
    )
    OR
    -- Verified paid customer
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.books b ON o.book_id = b.id
      WHERE b.pdf_path = object_name
        AND o.user_id = auth.uid()
        AND o.status = 'paid'
    )
  );
$$;

-- Check if user has purchased the book or it's free
CREATE OR REPLACE FUNCTION public.user_has_access_to_book(target_book_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.books
      WHERE id = target_book_id AND is_free = true AND is_published = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE book_id = target_book_id
        AND user_id = auth.uid()
        AND status = 'paid'
    )
  );
$$;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view basic author info or users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users view own profile or admins view all"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id AND (
        public.is_admin() OR role = 'customer'
    )
);

DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile without role elevation" ON public.profiles;
CREATE POLICY "Users update own profile without role elevation"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND (
        (public.is_admin()) OR (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    )
);

-- BOOKS POLICIES (STRICT: NO UNRESTRICTED POLICIES)
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

-- Customers can ONLY read published books (Admins can also view unpublished drafts)
CREATE POLICY "Customers can only read published books"
ON public.books FOR SELECT
USING (is_published = true OR public.is_admin());

-- Only authenticated administrators can insert new books
CREATE POLICY "Only authenticated admins can insert books"
ON public.books FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only authenticated administrators can update books
CREATE POLICY "Only authenticated admins can update books"
ON public.books FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only authenticated administrators can delete books
CREATE POLICY "Only authenticated admins can delete books"
ON public.books FOR DELETE
TO authenticated
USING (public.is_admin());

-- ORDERS POLICIES
DROP POLICY IF EXISTS "Users can view own orders or admin view all" ON public.orders;
CREATE POLICY "Users can view own orders or admin view all"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can update orders status" ON public.orders;
CREATE POLICY "Only admins can update orders status"
ON public.orders FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PAYMENT REQUESTS POLICIES
DROP POLICY IF EXISTS "Users view own payment requests or admins view all" ON public.payment_requests;
CREATE POLICY "Users view own payment requests or admins view all"
ON public.payment_requests FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can submit payment requests for their orders" ON public.payment_requests;
CREATE POLICY "Users can submit payment requests for their orders"
ON public.payment_requests FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Only admins can review payment requests" ON public.payment_requests;
CREATE POLICY "Only admins can review payment requests"
ON public.payment_requests FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- READING PROGRESS POLICIES
DROP POLICY IF EXISTS "Users can view own reading progress" ON public.reading_progress;
CREATE POLICY "Users can view own reading progress"
ON public.reading_progress FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own reading progress" ON public.reading_progress;
CREATE POLICY "Users can manage own reading progress"
ON public.reading_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 11. TRIGGER: AUTOMATIC PROFILE CREATION ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Macaamil Cusub'),
        'customer'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. STORAGE BUCKET CONFIGURATION & POLICIES
-- Note: Create buckets 'book-covers' (public) and 'book-pdfs' (private) in Supabase dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('book-pdfs', 'book-pdfs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policy: Anyone can view book covers
DROP POLICY IF EXISTS "Public can view book covers" ON storage.objects;
CREATE POLICY "Public can view book covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

-- --- BUCKET: book-covers (Public view, Admin-only write) ---
DROP POLICY IF EXISTS "Allow upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update book covers" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete book covers" ON storage.objects;

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
DROP POLICY IF EXISTS "Users with access can view book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow read book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Verified purchasers and admins can access book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete book PDFs" ON storage.objects;

-- Strictly private: verified purchasers (status = 'paid') or admins can read authorized PDFs
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
-- SEED DATA (SAMPLE HIGH QUALITY SOMALI BOOKS)
-- ====================================================================
INSERT INTO public.books (title, author, category, price, is_free, is_published, description, cover_path, pdf_path)
VALUES
(
    'Diiwaanka Gabayada Soomaaliyeed',
    'Cabdirashiid Maxamed Cali',
    'Suugaanta',
    0.00,
    true,
    true,
    'Uruurin dhameystiran oo ka hadlaysa maansada, maahmaahyada, iyo suugaanta facaweyn ee dadka Soomaaliyeed.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
    'sample-suugaan.pdf'
),
(
    'Sirta Ganacsiga Guuleystay ee Casriga ah',
    'Khadar Cabdullaahi Nuur',
    'Ganacsiga',
    4.50,
    false,
    true,
    'Hanuuniyaha ugu fiican ee dhismaha meherad guulaysata, suuq-geynta dijitaalka ah, iyo maamulka dhaqaalaha ee Geeska Afrika.',
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=600',
    'sample-ganacsi.pdf'
),
(
    'Taariikhda Dahabiga ah ee Soomaaliya',
    'Prof. Axmed Ismaaciil Samatar',
    'Taariikh',
    3.00,
    false,
    true,
    'Socdaal xaqiiqooyin ku dhisan oo dib u eegaya taariikhda qadiimiga ah ee xeebaha Soomaaliyeed iyo xadaaraddii hore.',
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600',
    'sample-taariikh.pdf'
),
(
    'Aasaaska Sayniska & Horumarka Teknoolojiyadda',
    'Dr. Maryan Cusmaan Faarax',
    'Cilmi',
    0.00,
    true,
    true,
    'Buug aasaas u ah fahamka cilmiga casriga ah, sida caqliga macmalka ah (AI) iyo saameynta uu ku leeyahay nolosha maalinlaha ah.',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
    'sample-cilmi.pdf'
),
(
    'Xeerarka Akhlaaqda & Diinta Islaamka',
    'Sheekh Cumar Shariif',
    'Diinta',
    0.00,
    true,
    true,
    'Darsi qiimo leh oo ku saabsan wanaagga, asluubta, tarbiyada suuban, iyo dhismaha qoyska ku dhisan naxariista iyo iimaanka.',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600',
    'sample-diinta.pdf'
),
(
    'Barashada Teknoolojiyadda Casriga ah & AI',
    'Eng. Jaamac Warsame',
    'Teknoolojiga',
    5.00,
    false,
    true,
    'Baro hababka barnaamij-samaynta, farsamooyinka xogta waaweyn, iyo sida dhalinyarada Soomaaliyeed uga faaiidaysan karaan fursadaha caalamiga ah.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
    'sample-tekno.pdf'
),
(
    'Daryeelka Caafimaadka Qoyska',
    'Dr. Sahra Xasan Jaamac',
    'Caafimaadka',
    2.50,
    false,
    true,
    'Xog faahfaahsan oo ku saabsan nafaqada, ka hortagga cudurrada caanka ah, daryeelka hooyada iyo dhallaanka.',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
    'sample-caafimaad.pdf'
);
