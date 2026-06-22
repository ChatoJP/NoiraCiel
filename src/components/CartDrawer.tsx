'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function CartDrawer() {
  const cart = useCart()

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (cart.open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [cart.open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cart.setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [cart])

  function buildMailtoBody() {
    const lines = cart.items.map(
      (item) => `- ${item.label} × ${item.qty}  (${item.price} each)`
    )
    const body = [
      'Hello,',
      '',
      'I would like to enquire about ordering the following items:',
      '',
      ...lines,
      '',
      `Total: €${cart.total.toFixed(2)}`,
      '',
      'Please let me know about availability, shipping, and payment.',
      '',
      'Thank you.',
    ].join('\n')
    return body
  }

  function handleEnquire() {
    const subject = encodeURIComponent('Order Enquiry — NoiraCiel')
    const body = encodeURIComponent(buildMailtoBody())
    window.location.href = `mailto:hello@noiraciel.com?subject=${subject}&body=${body}`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${
          cart.open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => cart.setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm flex flex-col border-l border-noir-silver/10 shadow-[−16px_0_60px_rgba(0,0,0,0.6)] transition-transform duration-300 ${
          cart.open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: '#0a0a14' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-noir-silver/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2
              className="text-xl text-noir-ivory/90 font-light tracking-wide"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
            >
              Your Cart
            </h2>
            {cart.count > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-noir-gold text-noir-void text-[10px] font-bold leading-none">
                {cart.count}
              </span>
            )}
          </div>
          <button
            onClick={() => cart.setOpen(false)}
            aria-label="Close cart"
            className="text-noir-silver/50 hover:text-noir-ivory transition-colors duration-200 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-20">
                <rect x="6" y="14" width="28" height="20" rx="1" stroke="#C4953A" strokeWidth="1.2" fill="none" />
                <path d="M13 14v-3a7 7 0 0114 0v3" stroke="#C4953A" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <p
                className="text-noir-silver/45 text-sm"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
              >
                Your cart is empty.
              </p>
              <Link
                href="/objects"
                onClick={() => cart.setOpen(false)}
                className="font-body text-[10px] tracking-[0.25em] uppercase text-noir-gold border border-noir-gold/40 px-4 py-2 hover:bg-noir-gold hover:text-noir-void transition-all duration-300"
              >
                Browse Objects
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3 border-b border-noir-silver/8 last:border-0">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-noir-deep border border-noir-silver/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.img}
                      alt={item.label}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm text-noir-ivory/80 leading-snug truncate"
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
                    >
                      {item.label}
                    </p>
                    <p className="font-body text-[11px] text-noir-gold/70 mt-0.5">{item.price}</p>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => cart.updateQty(item.id, item.qty - 1)}
                        aria-label="Decrease quantity"
                        className="w-6 h-6 flex items-center justify-center border border-noir-silver/20 text-noir-silver/60 hover:border-noir-gold/50 hover:text-noir-gold transition-all duration-200 text-sm leading-none font-body"
                      >
                        −
                      </button>
                      <span className="font-body text-xs text-noir-ivory/70 w-4 text-center tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => cart.updateQty(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                        className="w-6 h-6 flex items-center justify-center border border-noir-silver/20 text-noir-silver/60 hover:border-noir-gold/50 hover:text-noir-gold transition-all duration-200 text-sm leading-none font-body"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => cart.remove(item.id)}
                    aria-label={`Remove ${item.label}`}
                    className="text-noir-silver/30 hover:text-noir-ivory/60 transition-colors duration-200 text-lg leading-none mt-0.5 flex-shrink-0"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="px-6 py-5 border-t border-noir-silver/10 flex-shrink-0 space-y-4">
            {/* Subtotal */}
            <div className="flex items-baseline justify-between">
              <span className="font-body text-[10px] tracking-[0.3em] uppercase text-noir-silver/45">
                Subtotal
              </span>
              <span
                className="text-2xl text-noir-gold"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
              >
                €{cart.total.toFixed(2)}
              </span>
            </div>

            {/* Enquire button */}
            <button
              onClick={handleEnquire}
              className="w-full font-body text-xs tracking-[0.25em] uppercase bg-noir-gold text-noir-void px-6 py-4 hover:bg-[#d4a43e] transition-colors duration-300 flex items-center justify-center gap-2"
            >
              Enquire to Order
              <span aria-hidden="true">→</span>
            </button>

            {/* Clear cart link */}
            <button
              onClick={cart.clear}
              className="w-full font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/30 hover:text-noir-silver/60 transition-colors duration-200 text-center"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  )
}
