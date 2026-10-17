'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Plus } from 'lucide-react'

export interface ComboboxProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  dropdownClassName?: string
  disabled?: boolean
  hasError?: boolean
  emptyAction?: { label?: string; onClick: () => void }
  allowNumbers?: boolean
  allowCustomValue?: boolean
  placement?: 'auto' | 'top' | 'bottom'
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  disabled,
  hasError,
  emptyAction,
  allowNumbers = false,
  allowCustomValue = false,
  placement = 'auto',
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [openUpwards, setOpenUpwards] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && wrapperRef.current) {
      if (placement === 'top') {
        setOpenUpwards(true)
      } else if (placement === 'bottom') {
        setOpenUpwards(false)
      } else {
        const rect = wrapperRef.current.getBoundingClientRect()
        let parentBottom = window.innerHeight
        let parentTop = 0
        let p = wrapperRef.current.parentElement
        while (p && p !== document.body) {
          const style = window.getComputedStyle(p)
          const overflowY = style.overflowY
          if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden') {
            const pRect = p.getBoundingClientRect()
            parentBottom = Math.min(parentBottom, pRect.bottom)
            parentTop = Math.max(parentTop, pRect.top)
            break
          }
          p = p.parentElement
        }
        const spaceBelow = parentBottom - rect.bottom
        const spaceAbove = rect.top - parentTop
        // Si hay poco espacio abajo (< 260px) y más espacio arriba, abrir hacia arriba
        setOpenUpwards(spaceBelow < 260 && spaceAbove > 160)
      }
    }
  }, [open, placement])

  const findMatchingOption = (val: string) => {
    if (!val) return undefined
    const valTrim = val.trim().toLowerCase()
    return (
      options.find((o) => o.value === val) ||
      options.find((o) => o.value.trim().toLowerCase() === valTrim) ||
      options.find((o) => o.label.trim().toLowerCase() === valTrim)
    )
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
        const selectedLabel = findMatchingOption(value)?.label || (allowCustomValue ? value : '')
        setSearch(selectedLabel)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value, options])

  useEffect(() => {
    if (!open) {
      const selectedLabel = findMatchingOption(value)?.label || (allowCustomValue ? value : '')
      setSearch(selectedLabel)
    }
  }, [value, options, open])

  const selectedMatchedOption = findMatchingOption(value)
  const selectedLabel = selectedMatchedOption?.label || (allowCustomValue ? value : '')
  const selectedOptionValue = selectedMatchedOption?.value || value

  // Show all options if search is exactly the selected label, otherwise filter
  const isSearchMatchingLabel = search === selectedLabel
  const filteredOptions = isSearchMatchingLabel
    ? options
    : options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={wrapperRef} className={`relative ${open ? 'z-50' : 'z-10'} ${className}`}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            let val = e.target.value
            if (!allowNumbers) {
              val = val.replace(/[0-9]/g, '')
            }
            setSearch(val)
            setOpen(true)
            if (allowCustomValue || val === '') onChange(val)
          }}
          onClick={(e) => {
            if (!disabled) {
              setOpen(true)
              ;(e.target as HTMLInputElement).select()
            }
          }}
          title={search}
          className={`project-form-control w-full rounded-xl border ${hasError ? 'border-red-500 ring-1 ring-red-400' : open ? 'border-[#9B0F06]' : 'border-gray-200'} ${disabled ? 'bg-gray-100/90 text-gray-400 font-medium cursor-not-allowed select-none' : 'bg-white text-gray-700'} px-2.5 py-1.5 md:px-3 md:py-2 text-[10px] md:text-[11px] font-[Poppins] focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] pr-7 ${inputClassName}`}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setOpen(!open)
              if (!open) setSearch('')
            }
          }}
          className={`absolute inset-y-0 right-0 flex items-center px-1.5 ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ChevronDown size={13} />
        </button>
      </div>

      {open && (
        <div
          className={`absolute z-50 max-h-60 min-w-full w-max max-w-[380px] overflow-auto rounded-xl border border-gray-200 bg-white py-1 left-0 font-[Poppins] ${
            openUpwards
              ? 'bottom-full mb-1 shadow-[0_-8px_25px_rgba(0,0,0,0.12)]'
              : 'top-full mt-1 shadow-2xl'
          } ${dropdownClassName}`}
        >
          <div className="px-1 font-[Poppins]">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-[10px] md:text-[11px] text-gray-500 text-center font-[Poppins]">No hay resultados.</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  onClick={() => {
                    onChange(option.value)
                    setSearch(option.label)
                    setOpen(false)
                  }}
                  className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[10px] md:text-[11px] font-[Poppins] transition-colors hover:bg-gray-100 ${option.value === selectedOptionValue || option.value === value ? 'bg-gray-50 font-bold text-[#9B0F06]' : 'text-gray-700'}`}
                >
                  <span className="whitespace-normal break-words leading-tight flex-1">{option.label}</span>
                  {(option.value === selectedOptionValue || option.value === value) && <Check size={12} className="text-[#9B0F06] shrink-0 mt-0.5" />}
                </button>
              ))
            )}
          </div>

          {emptyAction && (
            <div className="mt-1 border-t border-gray-100 pt-1 px-1 font-[Poppins]">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setOpen(false)
                  emptyAction.onClick()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setOpen(false)
                  emptyAction.onClick()
                }}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[10px] md:text-xs font-bold text-[#9B0F06] hover:bg-red-50 transition-colors cursor-pointer font-[Poppins]"
              >
                <Plus size={13} className="text-[#9B0F06]" />
                <span>{emptyAction.label || 'Crear nuevo'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
