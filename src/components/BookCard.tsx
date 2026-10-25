import React from 'react';
import { BookOpen, Check, ShoppingBag } from 'lucide-react';
import { Book } from '../types';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  isOwned?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect, isOwned }) => {
  return (
    <div
      onClick={() => onSelect(book)}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-[#D1EADE] shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        <BookCover
          coverPath={book.cover_path}
          title={book.title}
          author={book.author}
          category={book.category}
          aspectClassName="w-full h-full"
        />

        {/* Status overlay tag (if owned or free) */}
        {isOwned ? (
          <div className="absolute top-3 left-3 bg-[#087A43] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1 z-10">
            <Check className="w-3 h-3" />
            <span>Maktabaddaada</span>
          </div>
        ) : book.is_free ? (
          <div className="absolute top-3 left-3 bg-[#12A85A] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md z-10">
            Bilaash
          </div>
        ) : null}

        {/* Hover quick action overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 z-10">
          <span className="bg-white text-[#087A43] text-xs font-bold py-2 px-4 rounded-xl shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <BookOpen className="w-4 h-4" />
            <span>Fiiri Buugga</span>
          </span>
        </div>
      </div>

      {/* Book Information (Title, Author, Category, Description, Price) */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#087A43] mb-1">
            {book.category}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug group-hover:text-[#087A43] transition-colors">
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {book.author}
          </p>

          {/* Description */}
          {book.description && (
            <p className="text-[11px] text-gray-600 mt-2 line-clamp-2 leading-relaxed">
              {book.description}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            {book.is_free ? (
              <span className="text-sm font-extrabold text-[#12A85A]">
                Bilaash
              </span>
            ) : (
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs text-gray-500 font-medium">$</span>
                <span className="text-base font-black text-gray-900">
                  {Number(book.price).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="text-xs font-bold text-[#087A43] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            {isOwned || book.is_free ? (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                Akhri
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Iibso
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
