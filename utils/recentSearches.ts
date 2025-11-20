// Recent searches utility
const RECENT_SEARCHES_KEY = 's4_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const getRecentSearches = (): string[] => {
    try {
        const data = localStorage.getItem(RECENT_SEARCHES_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const addRecentSearch = (query: string) => {
    if (!query || query.trim().length === 0) return;

    try {
        const searches = getRecentSearches();
        const filtered = searches.filter(s => s !== query);
        const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save recent search:', e);
    }
};

export const clearRecentSearches = () => {
    try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
        console.error('Failed to clear recent searches:', e);
    }
};
