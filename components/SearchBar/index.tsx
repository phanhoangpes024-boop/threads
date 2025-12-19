// components/SearchBar/index.tsx
'use client';

import React, { memo } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function SearchBar({ value, onChange, onKeyDown }: SearchBarProps) {
  return (
    <div className={styles.searchBar}>
      <div className={styles.searchInputWrapper}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Tìm kiếm"
          className={styles.searchInput}
          autoComplete="off"
        />
        <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </div>
    </div>
  );
}

export default memo(SearchBar);