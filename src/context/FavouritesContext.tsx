import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSavedListingIds, addSavedListingId, removeSavedListingId, isListingSaved } from '../api/favourites';
import { useAuth } from './AuthContext';

interface FavouritesContextType {
  savedIds: string[];
  toggleFavourite: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export const FavouritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>(getSavedListingIds());

  useEffect(() => {
    // Re-load favourites whenever user changes (user isolation)
    setSavedIds(getSavedListingIds());
  }, [user]);

  const toggleFavourite = (id: string) => {
    if (isListingSaved(id)) {
      const updated = removeSavedListingId(id);
      setSavedIds(updated);
    } else {
      const updated = addSavedListingId(id);
      setSavedIds(updated);
    }
  };

  const isSaved = (id: string) => savedIds.includes(id);

  return (
    <FavouritesContext.Provider value={{ savedIds, toggleFavourite, isSaved }}>
      {children}
    </FavouritesContext.Provider>
  );
};

export const useFavourites = () => {
  const context = useContext(FavouritesContext);
  if (!context) throw new Error('useFavourites must be used within FavouritesProvider');
  return context;
};
