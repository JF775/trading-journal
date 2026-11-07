'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface GlassSelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

interface GlassSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export default function GlassSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  menuClassName = '',
  disabled = false
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-[#080d1b] border border-white/[0.1] hover:border-emerald-500/40 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between gap-2 transition outline-none shadow-sm ${
          isOpen ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate font-medium text-slate-200">
            {selectedOption ? selectedOption.label : <span className="text-slate-500">{placeholder}</span>}
          </span>
          {selectedOption?.badge && (
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/[0.08] text-slate-300 font-mono">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Floating Glassmorphic Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 w-full min-w-[170px] max-h-60 overflow-y-auto rounded-xl bg-[#080d1b]/98 backdrop-blur-2xl border border-white/[0.15] shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {options.map(opt => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(String(opt.value));
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-left text-xs transition flex items-center justify-between gap-2 mb-0.5 last:mb-0 ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-slate-400 font-normal truncate">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
