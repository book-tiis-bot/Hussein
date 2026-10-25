import React, { useEffect, useState } from 'react';
import { X, BookOpen, ShoppingBag, Clock, CheckCircle2, FileText, User as UserIcon } from 'lucide-react';
import { Book, Profile } from '../types';
import { BookCover } from './BookCover';
import { orderService } from '../services/orderService';

interface BookDetailsModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile | null;
  onReadBook: (book: Book) => void;
  onBuyBook: (book: Book) => void;
  onRequireAuth: () => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  isOpen,
  onClose,
  currentUser,
  onReadBook,
  onBuyBook,
  onRequireAuth,
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    if (!book || !isOpen) return;

    let isMounted = true;
    const checkUserAccess = async () => {
      setCheckingAccess(true);
      try {
        if (book.is_free) {
          if (isMounted) setHasAccess(true);
          return;
        }

        if (!currentUser) {
          if (isMounted) {
            setHasAccess(false);
            setPendingPayment(null);
          }
          return;
        }

        // Check ownership & role access
        const allowed = await orderService.hasAccess(currentUser.id, book, currentUser.role);
        if (isMounted) setHasAccess(allowed);

        // Check if pending payment exists
        const paymentReqs = await orderService.getUserPaymentRequests(currentUser.id);
        const pending = paymentReqs.find(
          p => p.book?.id === book.id && p.status === 'pending'
        );
        if (isMounted) {
          setPendingPayment(pending ? pending.transaction_reference : null);
        }
      } catch (e) {
        console.error('Error checking access:', e);
      } finally {
        if (isMounted) setCheckingAccess(false);
      }
    };

    checkUserAccess();

    return () => {
      isMounted = false;
    };
  }, [book, isOpen, currentUser]);

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D1EADE] flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-gray-900 rounded-full bg-white/80 backdrop-blur-xs shadow-xs hover:bg-white transition-all cursor-pointer"
          aria-label="Xidh"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1">
          {/* Main Info Hero */}
          <div className="p-6 md:p-8 bg-gradient-to-b from-[#EAF7EF]/70 to-white flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* Book Cover */}
            <div className="w-44 sm:w-52 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden shadow-xl border border-white">
              <BookCover
                coverPath={book.cover_path}
                title={book.title}
                author={book.author}
                category={book.category}
                size="lg"
                aspectClassName="w-full h-full"
              />
            </div>

            {/* Book Meta & Headers */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-[#087A43]">
                  {book.category}
                </span>
                <h2 className="text-2xl font-black text-gray-900 mt-1 leading-snug">
                  {book.title}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-gray-600 mt-1.5 font-medium">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>Qoraaga: {book.author}</span>
                </div>
              </div>

              {/* Price Tag */}
              <div className="pt-2">
                {book.is_free ? (
                  <span className="text-2xl font-black text-[#12A85A]">
                    Bilaash (Free)
                  </span>
                ) : (
                  <div className="flex items-baseline justify-center sm:justify-start gap-1">
                    <span className="text-sm font-semibold text-gray-500">$</span>
                    <span className="text-3xl font-black text-gray-900">
                      {Number(book.price).toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">USD</span>
                  </div>
                )}
              </div>

              {/* Metadata attributes */}
              <div className="pt-2 flex flex-wrap gap-4 text-xs text-gray-500 justify-center sm:justify-start border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span>{book.pdf_path ? 'Faylka PDF waa diyaar' : 'Qoraal Dijitaal'}</span>
                </div>
                <div>Luqadda: <span className="font-semibold text-gray-700">Af-Soomaali</span></div>
                <div>Nooca: <span className="font-semibold text-gray-700">Dijitaal (PDF)</span></div>
              </div>
            </div>
          </div>

          {/* Book Description */}
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Sharaxaadda Buugga:
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {book.description || 'Buuggan kuma jiro faahfaahin dheeri ah xilligan.'}
              </p>
            </div>

            {/* Pending Payment Notice */}
            {pendingPayment && !hasAccess && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">
                    Codsigaagii bixinta lacagta EVC Plus wuxuu ku jiraa dib-u-eegis (Pending).
                  </span>
                  <p className="text-amber-800">
                    Waxaa laguugu furi doonaa marka maamulka BOOK-TIIS xaqiijiyo lacagta. Tixraacaada: <span className="font-mono font-bold">{pendingPayment}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Already Owned Notice */}
            {hasAccess && !book.is_free && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-[#12A85A] shrink-0" />
                <div>
                  <span className="font-bold block">Buuggan waad iibsatay oo wuxuu ku jiraa maktabaddaada!</span>
                  <span className="text-emerald-700">Waxaad u akhrisan kartaa wakhti kasta oo aad doonto.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
          >
            Ku noqo
          </button>

          <div className="flex items-center gap-3">
            {hasAccess || book.is_free ? (
              <button
                onClick={() => {
                  onClose();
                  onReadBook(book);
                }}
                className="py-3 px-6 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-md shadow-[#087A43]/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Akhri Buugga Hadda</span>
              </button>
            ) : pendingPayment ? (
              <button
                disabled
                className="py-3 px-6 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold cursor-not-allowed flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Sugaya Xaqiijin...</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!currentUser) {
                    onRequireAuth();
                  } else {
                    onClose();
                    onBuyBook(book);
                  }
                }}
                className="py-3 px-6 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-md shadow-[#087A43]/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Iibso Buuggan (${Number(book.price).toFixed(2)})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
