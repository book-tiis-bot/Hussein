import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Book, Order, PaymentRequest, Profile } from '../types';
import { orderService, EVC_PLUS_NUMBER, EVC_PLUS_INSTRUCTIONS } from '../services/orderService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  currentUser: Profile | null;
  onPaymentSubmitted: (paymentReq: PaymentRequest) => void;
  onRequireAuth: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  book,
  currentUser,
  onPaymentSubmitted,
  onRequireAuth,
}) => {
  const [transactionRef, setTransactionRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(EVC_PLUS_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!transactionRef.trim() || transactionRef.trim().length < 4) {
      setError('Fadlan geli Transaction ID sax ah oo aad ka heshay fariinta EVC Plus.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create or fetch pending order
      const orderRes = await orderService.createOrder(currentUser.id, book);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Ma suurtogelin abuurista dalabka.');
      }

      setPendingOrder(orderRes.order);

      // 2. Submit payment request with Transaction Reference
      const payRes = await orderService.submitPayment(
        orderRes.order.id,
        currentUser.id,
        transactionRef.trim()
      );

      if (!payRes.success || !payRes.paymentRequest) {
        throw new Error(payRes.error || 'Ma suurtogelin gudbinta tixraaca bixinta.');
      }

      setSubmitted(true);
      onPaymentSubmitted(payRes.paymentRequest);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D1EADE]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Xidh"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-[#EAF7EF] p-6 border-b border-[#D1EADE]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#087A43] text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#087A43]">
                Bixinta Lacagta (EVC Plus)
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Iibso buugga: <span className="font-semibold text-gray-900">{book.title}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!submitted ? (
            <div className="space-y-5">
              {/* Not Logged In Warning */}
              {!currentUser && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                  <span>Fadlan marka hore gal koontadaada si aad u iibsato buuggan.</span>
                  <button
                    onClick={onRequireAuth}
                    className="font-bold underline text-amber-950 hover:text-amber-700 ml-2 cursor-pointer"
                  >
                    Gal Hadda
                  </button>
                </div>
              )}

              {/* Price and Number Box */}
              <div className="bg-gradient-to-r from-[#EAF7EF]/70 to-[#EAF7EF]/30 p-4 rounded-2xl border border-[#D1EADE]">
                <div className="flex items-center justify-between pb-3 border-b border-[#D1EADE]/60">
                  <span className="text-xs font-semibold text-gray-600">Qiimaha Buugga:</span>
                  <span className="text-xl font-black text-[#087A43]">
                    ${Number(book.price).toFixed(2)} USD
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Lambarka EVC Plus:
                    </span>
                    <span className="text-2xl font-black text-gray-900 tracking-wider">
                      {EVC_PLUS_NUMBER}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D1EADE] text-[#087A43] hover:bg-[#EAF7EF] rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">La koobiyay!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Koobiyeey Lambarka</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Somali Instructions Requirement */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900 block mb-1">Tilmaamaha Bixinta:</span>
                {EVC_PLUS_INSTRUCTIONS}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form to submit transaction ID */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Geli Transaction ID (Tixraaca EVC Plus)
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Tusaale: TX983210 ama 0612345678"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Ka hel lambarka tixraaca fariinta qoraalka ah (SMS) ee EVC Plus kuugu soo diray lacag-bixinta ka dib.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Jooji
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !currentUser}
                    className="flex-2 py-3 px-5 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-md shadow-[#087A43]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Gudbinayaa...' : 'Gudbi Tixraaca Bixinta'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Success confirmation screen */
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-[#12A85A] border-2 border-emerald-100 flex items-center justify-center">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Codsigaaga Waa La Gudbiyay!
                </h3>
                <div className="inline-block mt-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-md">
                  Xaaladda: Sugaya Xaqiijin (Pending)
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl text-left text-xs text-gray-600 space-y-1.5 border border-gray-100">
                <div className="flex justify-between">
                  <span>Buugga:</span>
                  <span className="font-bold text-gray-900">{book.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Qiimaha:</span>
                  <span className="font-bold text-[#087A43]">${Number(book.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tixraaca EVC:</span>
                  <span className="font-mono font-bold text-gray-900">{transactionRef}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Maamulka BOOK-TIIS ayaa hadda xaqiijinaya lacag-bixintaada. Isla marka la xaqiijiyo, buuggan waxaa lagugu dari doonaa qaybta <span className="font-bold text-gray-800">"Maktabaddayda"</span> si aad u akhrisato.
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Waayahay, Waan Fahmay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
