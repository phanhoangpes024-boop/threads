// components/SearchSuggestions/index.tsx
'use client';

import React from 'react';
import styles from './SearchSuggestions.module.css';

interface Suggestion {
  id: string;
  text: string;
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  onSuggestionClick: (text: string) => void;
}

export default function SearchSuggestions({
  suggestions,
  onSuggestionClick,
}: SearchSuggestionsProps) {
  return (
    <div className={styles.container}>
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className={styles.suggestion}
          onClick={() => onSuggestionClick(suggestion.text)}
        >
          <svg className={styles.suggestionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <div className={styles.suggestionText}>{suggestion.text}</div>
          <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      ))}
    </div>
  );
}