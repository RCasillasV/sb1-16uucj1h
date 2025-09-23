// typescript
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import clsx from 'clsx';

interface Patology {
  id: string;
  nombre: string;
  especialidad: string | null;
  sexo: string | null;
}

interface PatologySearchAndSelectProps {
  value: string[]; // Array of selected pathology names
  onChange: (newValues: string[]) => void; // Callback to update the form
  placeholder?: string;
}

export function PatologySearchAndSelect({
  value,
  onChange,
  placeholder = 'Buscar y seleccionar patologías...',
}: PatologySearchAndSelectProps) {
  const { currentTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Patology[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        setLoadingSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const activePatologies = await api.patologies.getAllActive();
        const filtered = activePatologies.filter(
          (p: Patology) =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !value.includes(p.nombre) // Excluir ya seleccionadas por nombre
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching patology suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const handler = setTimeout(() => {
      fetchSuggestions();
    }, 300); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectSuggestion = (patology: Patology) => {
    onChange([...value, patology.nombre]); // Add name to the array
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemovePatology = (patologyName: string) => {
    onChange(value.filter((name) => name !== patologyName));
  };

  return (
    <div className="space-y-3">
      {/* Selected Patologies */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((patologyName) => (
            <div
              key={patologyName}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded-md"
              style={{
                background: `${currentTheme.colors.primary}20`, 
                color: currentTheme.colors.primary,
              }}
            >
              <span>{patologyName}</span>
              <button
                type="button"
                onClick={() => handleRemovePatology(patologyName)}
                className="ml-1 p-0.5 rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input and Suggestions */}
      <div className="relative" ref={searchRef}>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
          style={{ color: currentTheme.colors.textSecondary }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 rounded-md border"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          }}
        />
        {loadingSuggestions && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin"
            style={{ color: currentTheme.colors.textSecondary }}
          />
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute z-10 w-full mt-1 rounded-md shadow-lg border overflow-auto max-h-60"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            {suggestions.map((patology) => (
              <button
                key={patology.id}
                type="button"
                onClick={() => handleSelectSuggestion(patology)}
                className="w-full text-left px-4 py-2 hover:bg-black/5 transition-colors"
                style={{ color: currentTheme.colors.text }}
              >
                <div className="font-medium">{patology.nombre}</div>
                {patology.especialidad && (
                  <div className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
                    Especialidad: {patology.especialidad}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```