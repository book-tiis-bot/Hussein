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
      onBooksUpdated?.();
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
      onBooksUpdated?.();
    } else {
      showNotification(res.error || 'Ma suurtogelin tirista buugga', 'error');
      if (res.isRlsError) {
        setRlsSqlModal(res.error || 'RLS Policy Error');
      }
    }
  };

  // Review Payment
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
      </div>
    );
  }

  const filteredBooks = books.filter(b => {
    if (!bookSearch.trim()) return true;
    const q = bookSearch.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
  });

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
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
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

      {/* TAB 1: STATS */}
      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#087A43] flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.totalBooks}</div>
              <div className="text-xs text-gray-500 font-semibold mt-1">Wadarta Buugaagta</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.totalCustomers}</div>
              <div className="text-xs text-gray-500 font-semibold mt-1">Macaamiisha Guud</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.totalOrders}</div>
              <div className="text-xs text-gray-500 font-semibold mt-1">Wadarta Dalabaadka</div>
            </div>

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
        </div>
      )}

      {/* TAB 2: BOOKS */}
      {activeTab === 'books' && (
        <div className="space-y-6">
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
              className="py-2.5 px-5 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ku dar Buug Cusub</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
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
                    <td className="py-3 px-4 font-semibold">{book.category}</td>
                    <td className="py-3 px-4 font-bold">
                      {book.is_free ? <span className="text-[#12A85A]">Bilaash</span> : <span>${Number(book.price).toFixed(2)}</span>}
                    </td>
                    <td className="py-3 px-4">
                      {book.is_published ? <span className="text-emerald-700 font-bold">La faafiyay</span> : <span className="text-gray-400 font-bold">Qabyo</span>}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button onClick={() => onOpenBook(book)} className="p-1.5 text-gray-500 hover:text-[#087A43] cursor-pointer" title="Fiiri">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenEditBook(book)} className="p-1.5 text-gray-500 hover:text-blue-600 cursor-pointer" title="Wax ka beddel">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteBook(book.id)} className="p-1.5 text-gray-500 hover:text-red-600 cursor-pointer" title="Tir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="space-y-3">
            {filteredPayments.map((req) => (
              <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900">Buugga: {req.book?.title || 'Dijitaal'}</div>
                  <div className="text-xs text-gray-500">Macaamilka: {req.user?.full_name} | Trans ID: {req.transaction_reference}</div>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleReviewPayment(req.id, 'approved')} className="px-3 py-1.5 bg-[#087A43] text-white rounded-lg text-xs font-bold cursor-pointer">Aqbal</button>
                    <button onClick={() => handleReviewPayment(req.id, 'rejected')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold cursor-pointer">Diid</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT BOOK MODAL */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Magaca Buugga</label>
                <input
                  type="text"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Qoraaga</label>
                <input
                  type="text"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Qaybta (Category)</label>
                <select
                  value={bookForm.category}
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value as BookCategory })}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sharaxaadda (Description)</label>
                <textarea
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs h-24"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookForm.is_free}
                    onChange={(e) => setBookForm({ ...bookForm, is_free: e.target.checked })}
                    className="rounded text-[#087A43]"
                  />
                  <span>Buug Bilaash ah (Free)</span>
                </label>
              </div>
              {!bookForm.is_free && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Qiimaha ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bookForm.price}
                    onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sawirka Jeldiga (Cover Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="w-full text-xs"
                />
                {uploadingCover && <p className="text-xs text-gray-500 mt-1">Waa la soo gelinayaa sawirka...</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Faylka PDF-ka</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="w-full text-xs"
                />
                {uploadingPdf && <p className="text-xs text-gray-500 mt-1">Waa la soo gelinayaa PDF-ka...</p>}
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setBookModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Jooji
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#087A43] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Keydi Buugga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
