import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  searchKeywords?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
  id?: string;
  name?: string;
  allowClear?: boolean;
  noOptionsMessage?: string;
  icon?: React.ReactNode;
  allowCustomValue?: boolean;
  customValueLabel?: (val: string) => string;
}

function normalizeText(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  searchPlaceholder = 'Digite para pesquisar...',
  disabled = false,
  required = false,
  className = '',
  buttonClassName = '',
  id,
  name,
  allowClear = true,
  noOptionsMessage = 'Nenhuma opção encontrada',
  icon,
  allowCustomValue = false,
  customValueLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Encontra a opção selecionada ou exibe o valor personalizado
  const selectedOption =
    options.find((opt) => opt.value === value) ||
    (value ? { value, label: value } : undefined);

  // Filtra opções com busca inteligente (nome, sublabel, cidade, palavras-chave e valor)
  const normalizedSearch = normalizeText(searchTerm);
  const filteredOptions = options.filter((opt) => {
    if (!normalizedSearch) return true;
    const normLabel = normalizeText(opt.label);
    const normSub = opt.sublabel ? normalizeText(opt.sublabel) : '';
    const normKeywords = opt.searchKeywords ? normalizeText(opt.searchKeywords) : '';
    const normVal = normalizeText(opt.value);

    return (
      normLabel.includes(normalizedSearch) ||
      normSub.includes(normalizedSearch) ||
      normKeywords.includes(normalizedSearch) ||
      normVal.includes(normalizedSearch)
    );
  });

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Foca o campo de busca ao abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Rola o item destacado para a visualização
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (allowCustomValue && String(searchTerm || '').trim()) {
        handleSelect(String(searchTerm || '').trim());
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Campo invisível para compatibilidade com validação HTML de required */}
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Botão Gatilho do Combobox */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full text-left bg-white border border-slate-300 rounded-lg p-2 sm:py-2 sm:px-2.5 text-xs text-slate-800 transition-all flex items-center justify-between gap-2 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70' : 'cursor-pointer'
        } ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-slate-500 truncate font-normal">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {allowClear && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              title="Limpar seleção"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu com Pesquisa Inteligente */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Caixa de Pesquisa no topo do menu */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="text-[10px] text-slate-500 mt-1 px-1 flex items-center justify-between">
                <span>{filteredOptions.length} resultado(s)</span>
                <span className="text-slate-400">Pressione Enter para selecionar</span>
              </div>
            )}
          </div>

          {/* Lista de Opções */}
          <ul
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-50 text-xs focus:outline-none"
          >
            {allowCustomValue && String(searchTerm || '').trim() && !options.some((o) => String(o.value || '').toLowerCase() === String(searchTerm || '').trim().toLowerCase()) && (
              <li
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(String(searchTerm || '').trim())}
                className="px-3 py-2 cursor-pointer bg-indigo-50/70 hover:bg-indigo-100 text-indigo-950 flex items-center justify-between text-xs font-medium border-b border-indigo-100"
              >
                <div className="flex flex-col min-w-0">
                  <span className="truncate">
                    {customValueLabel ? customValueLabel(String(searchTerm || '').trim()) : `Usar valor digitado: "${String(searchTerm || '').trim()}"`}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-normal">Clique ou pressione Enter para confirmar</span>
                </div>
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded shadow-2xs">
                  Usar
                </span>
              </li>
            )}
            {filteredOptions.length === 0 ? (
              <li className="p-3 text-center text-slate-400 text-xs italic">
                {noOptionsMessage}
                {searchTerm && <span className="block text-[11px] text-slate-500 mt-0.5">para &ldquo;{searchTerm}&rdquo;</span>}
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={opt.value || `empty-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              opt.badgeColor || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-400 truncate mt-0.5">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
