import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface MultiSelectDropdownProps {
  id?: string;
  title: string;
  placeholder?: string;
  options: MultiSelectOption[] | string[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  icon?: React.ReactNode;
  badgeColor?: string;
  className?: string;
  minWidth?: string;
  compact?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  id,
  title,
  placeholder = 'Todos',
  options,
  selectedValues,
  onChange,
  icon,
  className = '',
  minWidth = 'min-w-[150px]',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: MultiSelectOption[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectAll = () => {
    onChange(normalizedOptions.map(o => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getButtonText = () => {
    if (selectedValues.length === 0) {
      return `${title}: ${placeholder}`;
    }
    if (selectedValues.length === 1) {
      const match = normalizedOptions.find(o => o.value === selectedValues[0]);
      return `${title}: ${match ? match.label : selectedValues[0]}`;
    }
    return `${title} (${selectedValues.length})`;
  };

  const hasSelection = selectedValues.length > 0;

  return (
    <div className={`relative inline-block text-left ${minWidth} ${className}`} ref={dropdownRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 transition-all text-xs font-semibold rounded-lg ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        } ${
          hasSelection
            ? 'bg-red-50 text-[#CF0A2C] border border-red-300 shadow-2xs'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        } focus:outline-none focus:ring-2 focus:ring-[#CF0A2C]/40`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate">
          {icon && <span className="shrink-0 text-gray-500">{icon}</span>}
          <span className="truncate">{getButtonText()}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {hasSelection && (
            <span className="bg-[#CF0A2C] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#CF0A2C]' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header Actions */}
          <div className="p-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-700">{title}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-semibold text-[#CF0A2C] hover:underline cursor-pointer"
              >
                Todos
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Search if more than 5 options */}
          {normalizedOptions.length > 5 && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar opción..."
                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#CF0A2C]"
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-gray-50">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-red-50/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-50/40 text-[#CF0A2C] font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#CF0A2C] border-[#CF0A2C] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                    </div>
                    {option.count !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                        {option.count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          {hasSelection && (
            <div className="p-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>{selectedValues.length} seleccionada(s)</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 bg-[#CF0A2C] text-white font-semibold rounded text-[10px] hover:bg-[#B00824]"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
