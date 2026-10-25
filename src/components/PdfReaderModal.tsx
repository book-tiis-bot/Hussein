import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Download, FileText, ShieldAlert, RefreshCw, Moon, Sun } from 'lucide-react';
import { Book, Profile } from '../types';
import { orderService } from '../services/orderService';
import { bookService } from '../services/bookService';

interface PdfReaderModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile | null;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({
  book,
  isOpen,
  onClose,
  currentUser,
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize and load reading session
  useEffect(() => {
    if (!book || !isOpen) return;

    let isMounted = true;
    const initReader = async () => {
      setLoading(true);
      setLoadError(null);
      setSignedUrl(null);

      try {
        // 1. Check authorization (Admin role grants automatic access; customers need is_free or verified purchase)
        const authorized = await orderService.hasAccess(currentUser?.id, book, currentUser?.role);
        if (!authorized && !book.is_free) {
          if (isMounted) setHasAccess(false);
          setLoading(false);
          return;
        }

        if (isMounted) setHasAccess(true);

        // 2. Load the real PDF from private Supabase Storage bucket 'book-pdfs'
        if (book.pdf_path && book.pdf_path.trim() !== '') {
          const url = await bookService.getSecurePdfUrl(book.pdf_path);
          if (isMounted) {
            if (url) {
              setSignedUrl(url);
            } else {
              setLoadError(`Faylka PDF-ka (${book.pdf_path}) laguma helin kaydka Supabase (book-pdfs).`);
            }
          }
        } else {
          if (isMounted) {
            setLoadError('Buuggan weli laguma darin faylka PDF-ka ee kaydka Supabase.');
          }
        }
      } catch (err: unknown) {
        console.error('Error loading reader:', err);
        const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay xilligii furitaanka PDF-ka';
        if (isMounted) setLoadError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initReader();

    return () => {
      isMounted = false;
    };
  }, [book, isOpen, currentUser]);

  if (!isOpen || !book) return null;

  // Access Denied Screen (For customers without verified purchase)
  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-red-100">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Helitaanka Waa Mamnuuc</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Buuggani waa buug lacag ah (${Number(book.price).toFixed(2)}). Waa inaad marka hore ku iibsataa EVC Plus oo uu maamulka BOOK-TIIS xaqiijiyaa lacag-bixintaada si aad u akhrisato.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#087A43] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-[#087A43]/20"
          >
            Ku noqo Maktabadda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#FAFBF9] text-gray-900'}`}>
      {/* Top Reader Controls Bar */}
      <header className={`px-4 sm:px-6 py-3 flex items-center justify-between border-b ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#D1EADE]'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#EAF7EF] text-[#087A43]'
            }`}
            title="Xidh Akhristaha"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold truncate">
              {book.title}
            </h3>
            <p className={`text-[11px] truncate ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              {book.author} • <span className="font-semibold text-[#087A43]">{book.category}</span>
            </p>
          </div>
        </div>

        {/* Reader Action Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {signedUrl && (
            <>
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    : 'bg-[#EAF7EF] hover:bg-[#D1EADE] text-[#087A43]'
                }`}
                title="Ka fur daaqad cusub ee biraawsarka"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Fur Daaqad Cusub</span>
              </a>

              <a
                href={signedUrl}
                download={`${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Soo dejiso faylka PDF-ka"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Soo Deji</span>
              </a>
            </>
          )}

          {/* Dark / Light toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode ? 'hover:bg-zinc-800 text-amber-300' : 'hover:bg-gray-100 text-gray-700'
            }`}
            title={isDarkMode ? 'Habka Maalinta' : 'Habka Habeenka'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 overflow-hidden p-2 sm:p-4 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#087A43] border-t-transparent animate-spin" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900">
                Diyaarinaya faylka PDF-ka ee dhabta ah...
              </h4>
              <p className="text-xs text-gray-500">
                Waxaa si ammaan ah looga soo xaqiijinayaa kaydka gaarka ah ee Supabase (book-pdfs).
              </p>
            </div>
          </div>
        ) : signedUrl ? (
          <div className="flex-1 w-full h-full rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-white">
            <object
              data={signedUrl}
              type="application/pdf"
              className="w-full h-full min-h-[500px]"
            >
              <iframe
                src={signedUrl}
                title={book.title}
                className="w-full h-full min-h-[500px]"
              >
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <FileText className="w-16 h-16 text-[#087A43] mx-auto" />
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-base font-bold text-gray-900">
                      Faylka PDF-ka ee buugga: {book.title}
                    </h4>
                    <p className="text-xs text-gray-600">
                      Biraawsarkaagu ma taageerayo gelinta tooska ah ee PDF-ka ee boggan. Guji badhanka hoose si aad ugu akhrisato daaqad cusub.
                    </p>
                  </div>
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-6 bg-[#087A43] hover:bg-[#066336] text-white text-xs font-bold rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Fur Faylka PDF-ka</span>
                  </a>
                </div>
              </iframe>
            </object>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-gray-900">
                Faylka PDF-ka lama helin
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {loadError || 'Buuggan weli laguma darin fayl PDF ah oo shaqeynaya.'}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="py-2.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Ku noqo Maktabadda
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
