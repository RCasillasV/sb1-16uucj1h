// src/components/NationalityAutocomplete.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase'; 
import clsx from 'clsx';

interface Nationality {
  id: string; 
  nacionalidad: string; 
}

interface NationalityAutocompleteProps {
  value: string; // El nombre de la nacionalidad actualmente seleccionada
  onChange: (nationalityName: string) => void; // Callback cuando se selecciona una nacionalidad
  placeholder?: string;
  disabled?: boolean;
  onSelectCallback?: () => void;
}

export function NationalityAutocomplete({
  value,
  onChange,
  placeholder = 'Buscar nacionalidad...',
  disabled = false,
  onSelectCallback,
}: NationalityAutocompleteProps) {
  const { currentTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<Nationality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sincroniza el searchTerm interno con la prop 'value' externa
  useEffect(() => {
    setSearchTerm(value);
    setIsUserTyping(false);
  }, [value]);

  // Efecto de búsqueda con debounce
  useEffect(() => {
    if (!isUserTyping) {
      return;
    }

    if (searchTerm.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tcNacionalidades')
          .select('id, nacionalidad')
          .ilike('nacionalidad', `%${searchTerm}%`)
          .order('nacionalidad', { ascending: true })
          .limit(15);

        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error fetching nationalities:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [searchTerm, isUserTyping]);

  const handleSelectSuggestion = useCallback((nationality: Nationality) => {
    setSearchTerm(nationality.nacionalidad);
    onChange(nationality.nacionalidad); // Pasa el nacionalidad seleccionado al formulario padre
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    if (onSelectCallback) { // <--- LLAMAR AL CALLBACK AQUÍ
       onSelectCallback();
     }
  }, [onChange, onSelectCallback]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsUserTyping(true);
    setSelectedSuggestionIndex(-1);
  };

  const handleInputBlur = () => {
    // Selección estricta: si el searchTerm actual no coincide con el valor, revierte o limpia
    // Pequeño retraso para permitir que el clic en una sugerencia se registre primero
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) { // Verifica si el foco no está en las sugerencias
        const found = suggestions.find(s => s.nacionalidad === searchTerm);
        if (!found && searchTerm !== value) { // Si el texto escrito no es una sugerencia y no es el valor válido actual
          setSearchTerm(value); // Revierte al último valor válido
          onChange(value); // Asegura que el padre también tenga el valor correcto
        }
        setShowSuggestions(false);
      }
    }, 100);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2 && suggestions.length > 0 && isUserTyping) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex !== -1 && suggestions[selectedSuggestionIndex]) {
        handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
      } else if (suggestions.length === 1 && searchTerm.toLowerCase() === suggestions[0].nacionalidad.toLowerCase()) {
        // Si solo hay una sugerencia y coincide con el texto escrito, selecciónala
        handleSelectSuggestion(suggestions[0]);
      } else {
        // Si se presiona Enter sin una selección y sin coincidencia exacta, revierte al valor anterior
        setSearchTerm(value);
        onChange(value);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  return (
    <div className="relative" ref={suggestionsRef}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
          style={{ color: currentTheme.colors.textSecondary }}
        />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'w-full pl-10 pr-4 py-2 rounded-md border transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          }}
        />
        {isLoading && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin"
            style={{ color: currentTheme.colors.textSecondary }}
          />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-10 w-full mt-1 rounded-md shadow-lg border overflow-auto max-h-60"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
        >
          {suggestions.map((nationality, index) => (
            <button
              key={nationality.id}
              type="button"
              onClick={() => handleSelectSuggestion(nationality)}
              className={clsx(
                'w-full text-left px-4 py-2 hover:bg-black/5 transition-colors',
                selectedSuggestionIndex === index && 'bg-black/10'
              )}
              style={{ color: currentTheme.colors.text }}
            >
              {nationality.nacionalidad}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
