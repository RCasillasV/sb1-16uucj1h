import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

interface PostalCodeData {
  d_codigo: string;
  d_tipo_asenta: string;
  d_asenta: string;
  d_mnpio: string;
  d_estado: string;
  d_ciudad: string;
}

interface PostalCodeLookupProps {
  value: string;
  onChange: (value: string) => void;
  onColonySelect: (asenta: string, colony: string,  municipality: string, state: string, city: string) => void;
  onError: (error: string | null) => void;
  error?: string;
}

export function PostalCodeLookup({ value, onChange, onColonySelect, onError, error }: PostalCodeLookupProps) {
  const { currentTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [colonies, setColonies] = useState<PostalCodeData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length === 5) {
      fetchPostalCodeData(value);
    } else {
      setColonies([]);
      setApiError(null);
    }
  }, [value]);

  const fetchPostalCodeData = async (postalCode: string) => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      const { data, error } = await supabase    
         .rpc('vbuscar_cp', { codpos: postalCode });

      if (error) throw error;
      if (!data?.length) throw new Error('Código postal no encontrado');
      
      onError(null);
      setColonies(data);
      setShowDropdown(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Error al buscar código postal');
      onError(err instanceof Error ? err.message : 'Error al buscar código postal');
      setColonies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 5);
    onChange(newValue);
  };

  const handleColonySelect = (colony: PostalCodeData) => {
    onColonySelect(colony.d_tipo_asenta, colony.d_asenta, colony.d_mnpio, colony.d_estado, colony.d_ciudad);
    setShowDropdown(false);
  };

  const filteredColonies = colonies.filter(colony =>
    colony.d_asenta.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 15);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={i} className="bg-yellow-200 text-gray-900">{part}</span> : 
        part
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length === 5 && setShowDropdown(true)}
          placeholder="Código Postal (5 dígitos)"
          aria-label="Código Postal"
          aria-invalid={!!error}
          aria-describedby={error ? "postal-code-error" : undefined}
          className={clsx(
            'w-full pl-10 pr-4 py-2 rounded-md border transition-colors',
            error && 'border-red-300 bg-red-50'
          )}
          style={{
            background: error ? '#FEF2F2' : currentTheme.colors.surface,
            borderColor: error ? '#FCA5A5' : currentTheme.colors.border,
            color: currentTheme.colors.text,
          }}
        />
        {isLoading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" 
            style={{ color: currentTheme.colors.textSecondary }} 
          />
        ) : (
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
            style={{ color: currentTheme.colors.textSecondary }} 
          />
        )}
      </div>

      {error && (
        <p 
          id="postal-code-error" 
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {apiError && (
        <div 
          className="mt-1 p-2 rounded-md flex items-center gap-2 text-sm"
          style={{
            background: '#FEE2E2',
            color: '#DC2626',
          }}
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {apiError}
        </div>
      )}

      {showDropdown && colonies.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 rounded-md shadow-lg border overflow-hidden"
          style={{ 
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
          role="listbox"
        >
          <div className="p-2 border-b" style={{ borderColor: currentTheme.colors.border }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar colonia..."
              className="w-full p-2 text-sm rounded-md border"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            />
          </div>
          
          <div 
            className="max-h-60 overflow-y-auto"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: `${currentTheme.colors.border} transparent`,
            }}
          >
            {filteredColonies.map((colony, index) => (
              <button
                key={`${colony.d_codigo}-${colony.d_asenta}`}
                onClick={() => handleColonySelect(colony)}
                className={clsx(
                  'w-full px-4 py-2 text-left hover:bg-black/5 transition-colors',
                  'focus:outline-none focus:bg-black/5'
                )}
                role="option"
                aria-selected={index === 0}
              >
                <div style={{ color: currentTheme.colors.text }}>
                  {highlightMatch(colony.d_asenta, searchTerm)}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  {colony.d_mnpio}, {colony.d_estado}
                </div>
              </button>
            ))}
          </div>
        </div>
      )} 
    </div>
  );
}