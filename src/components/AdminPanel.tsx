import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Upload, 
  Search, 
  RefreshCw, 
  FileText, 
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { AdminStats, Book, BookCategory, PaymentRequest, Profile } from '../types';
import { bookService } from '../services/bookService';
import { orderService } from '../services/orderService';
import { BookCover } from './BookCover';

interface AdminPanelProps {
  currentUser: Profile | null;
  onOpenBook: (book: Book) => void;
  onBooksUpdated?: () => void;
  onRefreshProfile?: () => Promise<void>;
}

const CATEGORIES: BookCategory[] = [
  'Diinta',
  'Taariikh',
  'Ganacsiga',
  'Cilmi',
  'Suugaanta',
  'Teknoolojiga',
  'Caafimaadka'
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onOpenBook, onBooksUpdated, onRefreshProfile }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'books' | 'payments'>('stats');
  const [stats, setStats] = useState<AdminStats>({
    totalBooks: 0,
    totalCustomers: 0,
    totalOrders: 0,
    verifiedSales: 0,
    pendingRequests: 0,
  });
  const [books, setBooks] = useState<Book[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [rlsSqlModal, setRlsSqlModal] = useState<string | null>(null);

  // Search & Filter
  const [bookSearch, setBookSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Add / Edit Book Modal State
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: 'Ganacsiga' as BookCategory,
    description: '',
    price: '0.00',
    is_free: false,
    cover_path: '',
    pdf_path: 'sample.pdf',
    is_published: true,
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Authorization Security Check
  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [statsData, booksRes, paymentsData] = await Promise.all([
        orderService.getAdminStats(),
        bookService.getBooks({ onlyPublished: false }),
        orderService.getAllPaymentRequests(),
      ]);

      setStats(statsData);
      setBooks(booksRes.books || []);
      setPayments(paymentsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Handle Book Form Open
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      category: 'Ganacsiga',
      description: '',
      price: '0.00',
      is_free: false,
      cover_path: '',
      pdf_path: '',
      is_published: true,
    });
    setBookModalOpen(true);
  };

  const handleOpenEditBook = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      category: (book.category as BookCategory) || 'Ganacsiga',
      description: book.description || '',
      price: book.is_free ? '0.00' : String(book.price),
      is_free: book.is_free,
      cover_path: book.cover_path || '',
      pdf_path: book.pdf_path || '',
      is_published: book.is_published,
    });
    setBookModalOpen(true);
  };

  // Handle Cover File Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const res = await bookService.uploadCoverImage(file);
      if (res.success && res.url) {
        setBookForm(prev => ({ ...prev, cover_path: res.url! }));
        showNotification('Sawirka jeldiga waa la geliyay!');
      } else {
        showNotification(res.error || 'Ma suurtogelin gelinta sawirka', 'error');
      }
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle PDF File Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showNotification('Fadlan xulo fayl PDF ah oo sax ah (.pdf)', 'error');
      return;
    }

    setUploadingPdf(true);
    try {
      const res = await bookService.uploadPdfFile(file);
      if (res.success && res.path) {
        setBookForm(prev => ({ ...prev, pdf_path: res.path! }));
        showNotification(`Faylka PDF-ka (${file.name}) waa la geliyay bucket-ka gaarka ah!`);
      } else {
        showNotification(res.error || 'Ma suurtogelin gelinta PDF-ka', 'error');
      }
    } finally {
      setUploadingPdf(false);
    }
  };

  // Save Book
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      showNotification('Fadlan buuxi magaca buugga iyo qoraaga', 'error');
      return;
    }

    const priceNum = bookForm.is_free ? 0 : parseFloat(bookForm.price) || 0;

    const res = await bookService.saveBook({
      id: editingBook?.id,
      title: bookForm.title.trim(),
      author: bookForm.author.trim(),
      category: bookForm.category,
      description: bookForm.description.trim(),
      price: priceNum,
      is_free: bookForm.is_free,
      cover_path: bookForm.cover_path,
      pdf_path: bookForm.pdf_path,
      is_published: bookForm.is_published,
    });

    if (res.success && res.data) {
      showNotification(
        editingBook
          ? `Buugga "${res.data.title}" si guul leh ayaa loogu cusboonaysiiyay Supabase!`
          : `Buugga "${res.data.title}" si toos ah ayaa loogu kaydiyay table-ka books ee Supabase!`
      );
      setBookModalOpen(false);
      await loadData();
      onBooksUpdated?.(); // Refresh customer home page and catalog immediately!
    } else {
      showNotification(res.error || 'Ma suurtogelin kaydinta buugga ee Supabase', 'error');
      if (res.isRlsError) {
        setRlsSqlModal(res.error || 'RLS Policy Error');
      }
    }
  };

  // Delete Book
  const handleDeleteBook = async (id: string) => {
    const res = await bookService.deleteBook(id);
    if (res.success) {
      showNotification('Buugga si guul leh ayaa looga tiray table-ka books ee Supabase');
      setDeleteConfirmId(null);
      await loadData();
      onBooksUpdated?.(); // Refresh customer home page immediately!
    } else {
      showNotification(res.error || 'Ma suurtogelin tirista buugga', 'error');
      if (res.isRlsError) {
        setRlsSqlModal(res.error || 'RLS Policy Error');
      }
    }
  };

  // Review Payment (Approve or Reject)
  const handleReviewPayment = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!currentUser) return;

    const res = await orderService.reviewPayment(requestId, action, currentUser.id);
    if (res.success) {
      showNotification(
        action === 'approved'
          ? 'Lacag-bixinta waa la ogolaaday! Macaamilka waxaa loo furay buugga.'
          : 'Codsiga lacag-bixinta waa la diiday.'
      );
      loadData();
    } else {
      showNotification(res.error || 'Ma suurtogelin xaqiijinta', 'error');
    }
  };

  // Security Check: If NOT admin, show access denied
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Helitaanka Waa Mamnuuc (Access Denied)
        </h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
          Qaybtan waxaa geli kara oo kaliya maamulka BOOK-TIIS ee xogtiisa lagu xaqiijiyay xog-kaydka Supabase (table-ka <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">profiles</code>). Koontadaada hadda doorkeedu waa <strong className="text-gray-800">{currentUser?.role || 'Macaamil'}</strong>.
        </p>

        {onRefreshProfile && (
          <div className="mb-6">
            <button
              onClick={() => onRefreshProfile()}
              className="py-2.5 px-5 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Dib u hubi Doorka Maamulka (Refresh Role)</span>
            </button>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500 max-w-md mx-auto text-left space-y-2">
          <div className="font-bold text-gray-700">Sida doorka loogu beddelo Maamule (Admin):</div>
          <p>
            1. Tag <strong>Supabase SQL Editor</strong>.<br />
            2. Ku shaqee SQL-kan si koontadaada loogu kordhiyo doorka maamulaha:
          </p>
          <div className="bg-gray-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] select-all">
            UPDATE public.profiles SET role = 'admin' WHERE id = '{currentUser?.id || 'USER_ID'}';
          </div>
        </div>
      </div>
    );
  }

  // Filter books
  const filteredBooks = books.filter(b => {
    if (!bookSearch.trim()) return true;
    const q = bookSearch.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
  });

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest bg-amber-800 text-amber-200 px-2.5 py-0.5 rounded-md">
                Admin Area
              </span>
              <span className="text-xs text-amber-300">
                Gashan: {currentUser?.full_name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Qeybta Maamulka BOOK-TIIS
            </h1>
            <p className="text-xs text-amber-200/80 mt-1">
              Maamul buugaagta, fiiri dalabaadka macaamiisha, oo xaqiiji lacagaha EVC Plus.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all backdrop-blur-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Dib u culee (Refresh)</span>
        </button>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'stats'
              ? 'border-[#087A43] text-[#087A43]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Dulmar & Tirakoob (Stats)</span>
        </button>

        <button
          onClick={() => setActiveTab('books')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'books'
              ? 'border-[#087A43] text-[#087A43]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Maamulka Buugaagta ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap relative ${
            activeTab === 'payments'
              ? 'border-[#087A43] text-[#087A43]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Xaqiijinta EVC Plus</span>
          {stats.pendingRequests > 0 && (
            <span className="ml-1.5 px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-black animate-pulse">
              {stats.pendingRequests}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: DASHBOARD STATS */}
      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Books */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#087A43] flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.totalBooks}</div>
              <div className="text-xs text-gray-500 font-semibold mt-1">Wadarta Buugaagta</div>
            </div>

            {/* Stat 2: Total Customers */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.totalCustomers}</div>
              <div className="text-xs text-gray-500 font-semibold mt-1">Macaamiisha Guud</div>
            </div>

            {/* Stat 3: Total Orders */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.totalOrders}</div>
              <div className="text-xs text-gray-500 font-semibold mt-1">Wadarta Dalabaadka</div>
            </div>

            {/* Stat 4: Verified Sales */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#087A43] text-white flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-[#087A43]">
                ${Number(stats.verifiedSales).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 font-semibold mt-1">Iibka La Xaqiijiyay</div>
            </div>
          </div>

          {/* Pending Alerts Banner */}
          {stats.pendingRequests > 0 ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                <div>
                  <h4 className="text-base font-black text-amber-950">
                    Waxaa jira {stats.pendingRequests} codsi lacag-bixin EVC Plus ah oo sugaya xaqiijin!
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Macaamiishu waxay gudbiyeen tixraacyada EVC Plus. Fadlan xaqiiji si ay buugaagtu ugu furmaan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer"
              >
                Xaqiiji Hadda →
              </button>
            </div>
          ) : (
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-3 text-xs text-emerald-900">
              <CheckCircle className="w-5 h-5 text-[#12A85A] shrink-0" />
              <span>Dhammaan codsiyadii lacag-bixinta waa la maareeyay. Ma jiro codsi cusub oo sugaya xaqiijin hadda.</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOK MANAGEMENT */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Raadi buug ama qoraa..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#087A43]"
              />
            </div>

            <button
              onClick={handleOpenAddBook}
              className="py-2.5 px-5 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-md shadow-[#087A43]/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ku dar Buug Cusub</span>
            </button>
          </div>

          {/* Books Table / Grid */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Buugga</th>
                    <th className="py-3.5 px-4">Qaybta</th>
                    <th className="py-3.5 px-4">Qiimaha</th>
                    <th className="py-3.5 px-4">Xaaladda</th>
                    <th className="py-3.5 px-4 text-right">Ficilada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <BookCover
                            coverPath={book.cover_path}
                            title={book.title}
                            author={book.author}
                            category={book.category}
                            size="sm"
                            aspectClassName="w-10 h-14 shrink-0 rounded-md overflow-hidden"
                          />
                          <div>
                            <div className="font-bold text-gray-900 line-clamp-1">{book.title}</div>
                            <div className="text-[11px] text-gray-500">{book.author}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-700">{book.category}</span>
                      </td>

                      <td className="py-3 px-4 font-bold">
                        {book.is_free ? (
                          <span className="text-[#12A85A]">Bilaash</span>
                        ) : (
                          <span>${Number(book.price).toFixed(2)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {book.is_published ? (
                          <span className="text-[11px] font-bold text-emerald-700">
                            La faafiyay
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400">
                            Qabyo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => onOpenBook(book)}
                          className="p-1.5 text-gray-500 hover:text-[#087A43] hover:bg-[#EAF7EF] rounded-lg transition-colors cursor-pointer"
                          title="Fiiri buugga"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditBook(book)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Wax ka beddel"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(book.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Tir buugga"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBooks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        Buug lama helin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT REQUESTS (EVC PLUS) */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaymentFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paymentFilter === 'all'
                  ? 'bg-[#087A43] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Dhammaan ({payments.length})
            </button>
            <button
              onClick={() => setPaymentFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paymentFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Sugaya Xaqiijin ({payments.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setPaymentFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paymentFilter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              La Ogolaaday ({payments.filter(p => p.status === 'approved').length})
            </button>
            <button
              onClick={() => setPaymentFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paymentFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              La Diiday ({payments.filter(p => p.status === 'rejected').length})
            </button>
          </div>

          {/* Payment Requests List */}
          <div className="space-y-3">
            {filteredPayments.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-gray-400">ID: {req.id}</span>
                    {req.status === 'pending' && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Sugaya Xaqiijin
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        La Ogolaaday (Paid)
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        La Diiday
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-bold text-gray-900">
                    Buugga: {req.book?.title || req.order?.book?.title || 'Buugga Dijitaalka ah'}
                  </div>

                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Macaamilka: <strong className="text-gray-700">{req.user?.full_name || 'Macaamil'}</strong> ({req.user?.email || 'N/A'})</span>
                    <span>Taariikhda: {new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Transaction Ref Box & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left">
                    <div className="text-[10px] uppercase font-bold text-gray-500">
                      Tixraaca EVC Plus (Trans ID)
                    </div>
                    <div className="text-sm font-mono font-black text-[#087A43]">
                      {req.transaction_reference}
                    </div>
                    <div className="text-[11px] font-bold text-gray-700 mt-0.5">
                      Lacagta: ${Number(req.order?.amount || req.book?.price || 0).toFixed(2)}
                    </div>
                  </div>

                  {req.status === 'pending' ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleReviewPayment(req.id, 'approved')}
                        className="flex-1 sm:flex-none py-2.5 px-4 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aqbal oo Fur Buugga</span>
                      </button>
                      <button
                        onClick={() => handleReviewPayment(req.id, 'rejected')}
                        className="flex-1 sm:flex-none py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Diid</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-xs text-gray-400">
                      <div>Xaqiijiyay: {req.reviewed_by ? 'Maamulka' : 'Otomaatig'}</div>
                      {req.reviewed_at && (
                        <div>{new Date(req.reviewed_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                Ma jiro codsi lacag-bixineed oo la helay.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT BOOK MODAL */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D1EADE] max-h-[90vh] flex flex-col">
            <div className="p-6 bg-[#EAF7EF] border-b border-[#D1EADE] flex items-center justify-between">
              <h3 className="text-lg font-black text-[#087A43]">
                {editingBook ? 'Wax ka beddel Buugga' : 'Ku dar Buug Cusub'}
              </h3>
              <button
                onClick={() => setBookModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Magaca Buugga (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Tusaale: Diiwaanka Gabayada Soomaaliyeed"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#087A43]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Qoraaga (Author) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    placeholder="Tusaale: Cabdirashiid Maxamed"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#087A43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Qaybta (Category) *
                  </label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value as BookCategory })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#087A43]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Free vs Paid Toggle */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-900">Buug Bilaash ah (Free)</div>
                    <div className="text-[11px] text-gray-500">Macaamiishu bilaash bay ku akhrisan karaan</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookForm.is_free}
                    onChange={(e) => setBookForm({ ...bookForm, is_free: e.target.checked })}
                    className="w-5 h-5 accent-[#087A43] rounded cursor-pointer"
                  />
                </div>

                {!bookForm.is_free && (
                  <div className="pt-2 border-t border-gray-200">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Qiimaha Buugga (USD $)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.50"
                      value={bookForm.price}
                      onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                      placeholder="4.50"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#087A43]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sharaxaadda Buugga (Description)
                </label>
                <textarea
                  rows={3}
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  placeholder="Faahfaahin ku saabsan mawduuca buugga..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#087A43]"
                />
              </div>

              {/* Cover Image URL / Upload & Live Preview */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sawirka Jeldiga (Cover Image - Public bucket 'book-covers')
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bookForm.cover_path}
                    onChange={(e) => setBookForm({ ...bookForm, cover_path: e.target.value })}
                    placeholder="URL toos ah ama soo geli sawir cusub..."
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#087A43]"
                  />
                  <label className="py-2 px-3 bg-white border border-[#D1EADE] text-[#087A43] hover:bg-[#EAF7EF] rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingCover ? 'Gelinayaa...' : 'Geli Sawir'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                      className="hidden"
                    />
                  </label>
                  {bookForm.cover_path && (
                    <button
                      type="button"
                      onClick={() => setBookForm({ ...bookForm, cover_path: '' })}
                      className="py-2 px-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
                      title="Ka saar sawirka (use neutral title cover)"
                    >
                      Tir
                    </button>
                  )}
                </div>

                {/* Live Cover Preview */}
                <div className="mt-2 p-3 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center gap-4">
                  <div className="w-14 h-20 shrink-0 rounded-lg overflow-hidden shadow-xs border border-gray-200">
                    <BookCover
                      coverPath={bookForm.cover_path}
                      title={bookForm.title || 'Magaca Buugga'}
                      author={bookForm.author || 'Qoraaga'}
                      category={bookForm.category}
                      size="sm"
                      aspectClassName="w-full h-full"
                    />
                  </div>
                  <div className="text-[11px] text-gray-600 space-y-0.5">
                    <div className="font-bold text-gray-800">Muujinta Jeldiga (Cover Preview):</div>
                    {bookForm.cover_path ? (
                      <p className="text-emerald-700 font-medium">
                        Sawir gaar ah ayaa la doortay oo buuggu ku soo bixi doonaa.
                      </p>
                    ) : (
                      <p className="text-gray-500">
                        Ma jiro sawir la doortay. Buuggu wuxuu si qurux badan ugu soo bixi doonaa jeldiga casriga ah ee BOOK-TIIS.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* PDF File Upload (Private Bucket 'book-pdfs') */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Faylka PDF-ka (Private Storage - 'book-pdfs')
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bookForm.pdf_path}
                    onChange={(e) => setBookForm({ ...bookForm, pdf_path: e.target.value })}
                    placeholder="Tusaale: buug_dijitaal.pdf ama xulo fayl..."
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#087A43]"
                  />
                  <label className="py-2 px-3 bg-white border border-[#D1EADE] text-[#087A43] hover:bg-[#EAF7EF] rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{uploadingPdf ? 'Gelinayaa...' : 'Geli PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUpload}
                      disabled={uploadingPdf}
                      className="hidden"
                    />
                  </label>
                  {bookForm.pdf_path && (
                    <button
                      type="button"
                      onClick={() => setBookForm({ ...bookForm, pdf_path: '' })}
                      className="py-2 px-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
                      title="Ka saar faylka PDF-ka"
                    >
                      Tir
                    </button>
                  )}
                </div>

                {bookForm.pdf_path ? (
                  <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate font-mono text-[11px] font-bold">
                      Faylka la doortay: {bookForm.pdf_path}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-400">
                    Weli ma jiro fayl PDF ah oo la xushay. Geli fayl PDF ah si macaamiishu u akhristaan buuggan.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publish_cb"
                  checked={bookForm.is_published}
                  onChange={(e) => setBookForm({ ...bookForm, is_published: e.target.checked })}
                  className="w-4 h-4 accent-[#087A43] rounded cursor-pointer"
                />
                <label htmlFor="publish_cb" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Toos u daabac maktabadda (Published)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBookModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Jooji
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-md shadow-[#087A43]/20 cursor-pointer"
                >
                  {editingBook ? 'Kaydi Isbeddelka' : 'Daabac Buugga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-gray-900">Ma hubtaa inaad tirto buuggan?</h4>
              <p className="text-xs text-gray-500 mt-1">
                Tallaabadan dib looma noqon karo. Buugga waxaa laga saari doonaa maktabadda.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Jooji
              </button>
              <button
                onClick={() => handleDeleteBook(deleteConfirmId)}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Haa, Tir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RLS POLICY FIX MODAL (SHOWN IF SUPABASE RLS BLOCKS INSERT/STORAGE) */}
      {rlsSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full text-left space-y-4 shadow-2xl border border-amber-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="font-black text-sm text-gray-900">
                  Fasaxa Xeerarka Amniga Supabase (RLS Policy)
                </h4>
              </div>
              <button
                onClick={() => setRlsSqlModal(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Supabase waxay u baahan tahay in xeerarka amniga (RLS Policies) ee buugaagta iyo kaydka PDF-ka si ammaan ah loogu habeeyo SQL Editor-ka. Kani wuxuu hubinayaa in <strong>kaliya maamulaha authenticated-ka ahi</strong> uu wax ku dari karo ama wax ka beddeli karo, macaamiishuna ay akhrisan karaan kaliya buugaagta la faafiyay ama kuwa ay iibsadeen:
            </p>

            <div className="bg-gray-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto select-all leading-relaxed border border-gray-800 max-h-56">
              -- 1. Helper: Admin authorization check<br/>
              CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$<br/>
              &nbsp;&nbsp;SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = &#39;admin&#39;);<br/>
              $$;<br/><br/>
              -- 2. Books: Customers read published only, admins manage all<br/>
              ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;<br/>
              CREATE POLICY &quot;Customers can only read published books&quot; ON public.books FOR SELECT USING (is_published = true OR public.is_admin());<br/>
              CREATE POLICY &quot;Only authenticated admins can insert books&quot; ON public.books FOR INSERT TO authenticated WITH CHECK (public.is_admin());<br/>
              CREATE POLICY &quot;Only authenticated admins can update books&quot; ON public.books FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());<br/>
              CREATE POLICY &quot;Only authenticated admins can delete books&quot; ON public.books FOR DELETE TO authenticated USING (public.is_admin());<br/><br/>
              -- 3. Storage: Private PDFs accessible only by verified purchasers or admins<br/>
              CREATE POLICY &quot;Verified purchasers and admins can access book PDFs&quot; ON storage.objects FOR SELECT USING (bucket_id = &#39;book-pdfs&#39; AND public.can_access_book_pdf(name));<br/>
              CREATE POLICY &quot;Only admins can upload book PDFs&quot; ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = &#39;book-pdfs&#39; AND public.is_admin());
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  fetch('/supabase/secure_policies.sql')
                    .then(res => res.text())
                    .then(sqlText => {
                      navigator.clipboard.writeText(sqlText);
                      showNotification('Koodhka Amniga SQL (secure_policies.sql) waa la koobiyeeyay!', 'success');
                    })
                    .catch(() => {
                      navigator.clipboard.writeText(`-- Ka eeg faylka /supabase/secure_policies.sql`);
                      showNotification('Koodhka SQL waa la koobiyeeyay!', 'success');
                    });
                }}
                className="py-2.5 px-4 bg-[#087A43] hover:bg-[#066336] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Koobiyeey Secure SQL Policies</span>
              </button>

              <button
                onClick={() => setRlsSqlModal(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Waan Fahmay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
