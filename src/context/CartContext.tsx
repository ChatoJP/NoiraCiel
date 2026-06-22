'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface CartItem {
  id: string
  label: string
  price: string
  priceNum: number
  img: string
  qty: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  total: number
  add: (item: Omit<CartItem, 'qty'>) => void
  remove: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clear: () => void
  open: boolean
  setOpen: (v: boolean) => void
}

const CartContext = createContext<CartContextValue | null>(null)

function parsePrice(price: string): number {
  const match = price.replace(/[€$£,]/g, '').trim()
  const num = parseFloat(match)
  return isNaN(num) ? 0 : num
}

const STORAGE_KEY = 'noiraciel-cart'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as CartItem[]
  } catch {
    // ignore parse errors
  }
  return []
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [open, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadCart())
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore storage errors
    }
  }, [items, hydrated])

  const add = useCallback((item: Omit<CartItem, 'qty'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...item, priceNum: item.priceNum ?? parsePrice(item.price), qty: 1 }]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    } else {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i))
    }
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((acc, i) => acc + i.qty, 0)
  const total = items.reduce((acc, i) => acc + i.priceNum * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, count, total, add, remove, updateQty, clear, open, setOpen }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
