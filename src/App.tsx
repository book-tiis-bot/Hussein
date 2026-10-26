import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Profile, Book } from './types';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { BookCatalogueView } from './components/BookCatalogueView';
import { MyLibraryView } from './components/MyLibraryView';
import { AccountView } from './components/AccountView';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'catalogue' | 'library' | 'admin' | 'account'>('home');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ownedBookIds, setOwnedBookIds] = useState<Set<string>>(new Set());

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setCurrentUser(data);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setBooks(data || []);
    } catch (err: any) {
      console.error('Cillad buugaagta la soo qaadayo:', err);
      setError(err.message || 'Cillad ayaa dhacday');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnedBooks = async () => {
    if (!currentUser) {
      setOwnedBookIds(new Set());
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_books')
        .select('book_id')
        .eq('user_id', currentUser.id);

      if (!error && data) {
        setOwnedBookIds(new Set(data.map((item: any) => item.book_id)));
      }
    } catch (err) {
      console.error('Cillad user_books:', err);
    }
  };

  useEffect(() => {
    refreshProfile();
    fetchBooks();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchOwnedBooks();
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        onOpenAuth={() => setCurrentView('account')}
        onLogout={async () => {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setOwnedBookIds(new Set());
          setCurrentView('home');
        }}
      />
      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomeView
            books={books}
            loading={loading}
            error={error}
            onRefresh={fetchBooks}
            onSelectBook={(book) => {
              console.log('Buug la doortay:', book);
            }}
            onNavigateToCatalogue={() => {
              setCurrentView('catalogue');
            }}
            onNavigateToLibrary={() => setCurrentView('library')}
            ownedBookIds={ownedBookIds}
          />
        )}
        {currentView === 'catalogue' && (
          <BookCatalogueView
            currentUser={currentUser}
            books={books}
            loading={loading}
            ownedBookIds={ownedBookIds}
            onSelectBook={(book) => console.log(book)}
          />
        )}
        {currentView === 'library' && (
          <MyLibraryView
            currentUser={currentUser}
            ownedBookIds={ownedBookIds}
            books={books}
            onSelectBook={(book) => console.log(book)}
          />
        )}
        {currentView === 'account' && (
          <AccountView
            currentUser={currentUser}
            onLogout={async () => {
              await supabase.auth.signOut();
              setCurrentUser(null);
              setOwnedBookIds(new Set());
              setCurrentView('home');
            }}
            onOpenAuth={() => setCurrentView('account')}
            onRefreshProfile={refreshProfile}
          />
        )}
      </main>
    </div>
  );
}
