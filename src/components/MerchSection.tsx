'use client'

import { useEffect, useRef, useState } from 'react'

type MerchKind = 'all' | 'apparel' | 'home' | 'print' | 'accessories' | 'stationery'

const MERCH_ITEMS = [
  // ── Apparel ──────────────────────────────────────────────────────────────
  { id: 'atlantic-noir-wordmark',  label: 'Atlantic Noir Wordmark',       kind: 'apparel',     img: '/Images/merch/atlantic-noir-wordmark.jpg',  tag: 'T-Shirt',     price: '€35' },
  { id: 'the-road-itself',         label: '"The Road Itself"',             kind: 'apparel',     img: '/Images/merch/the-road-itself.jpg',          tag: 'T-Shirt',     price: '€35' },
  { id: 'leave-a-light-on',        label: '"Leave A Light On"',            kind: 'apparel',     img: '/Images/merch/leave-a-light-on.jpg',         tag: 'T-Shirt',     price: '€35' },
  { id: 'roots-we-cannot-see',     label: 'The Roots We Cannot See',       kind: 'apparel',     img: '/Images/merch/roots-we-cannot-see.jpg',      tag: 'T-Shirt',     price: '€35' },
  { id: 'free-men-tell-truth',     label: '"Free Men Tell The Truth"',     kind: 'apparel',     img: '/Images/merch/free-men-tell-truth.jpg',      tag: 'T-Shirt',     price: '€35' },
  { id: 'hoodie-sea-soul',         label: 'Sea-Soul Hoodie',               kind: 'apparel',     img: '/Images/merch/hoodie-sea-soul.jpg',          tag: 'Hoodie',      price: '€65' },
  { id: 'hoodie-free-men',         label: '"Free Men" Hoodie',             kind: 'apparel',     img: '/Images/merch/hoodie-free-men.jpg',          tag: 'Hoodie',      price: '€65' },
  { id: 'longsleeve-atlantic',     label: 'Atlantic Long Sleeve',          kind: 'apparel',     img: '/Images/merch/atlantic-noir-wordmark.jpg',   tag: 'Long Sleeve', price: '€40' },
  { id: 'beanie-nc',               label: 'NoiraCiel Beanie',              kind: 'apparel',     img: '/Images/merch/cap-nc-monogram.jpg',          tag: 'Beanie',      price: '€28' },

  // ── Home & Lifestyle ─────────────────────────────────────────────────────
  { id: 'candle-atlantic-night',   label: 'Atlantic Night Candle',         kind: 'home',        img: '/Images/merch/mug-atlantic-dawn.jpg',        tag: 'Candle',      price: '€32' },
  { id: 'candle-leave-light',      label: '"Leave A Light On" Candle',     kind: 'home',        img: '/Images/merch/mug-empty-chair.jpg',          tag: 'Candle',      price: '€32' },
  { id: 'candle-memory',           label: 'Memory · Woody Noir Candle',    kind: 'home',        img: '/Images/merch/mug-atlantic-dawn.jpg',        tag: 'Candle',      price: '€32' },
  { id: 'candle-set-sea-soul',     label: 'Sea-Soul Candle Set (3)',        kind: 'home',        img: '/Images/merch/mug-empty-chair.jpg',          tag: 'Candle Set',  price: '€85' },
  { id: 'mug-atlantic-dawn',       label: 'Atlantic Dawn Mug',             kind: 'home',        img: '/Images/merch/mug-atlantic-dawn.jpg',        tag: 'Mug',         price: '€22' },
  { id: 'mug-empty-chair',         label: '"The Empty Chair" Mug',         kind: 'home',        img: '/Images/merch/mug-empty-chair.jpg',          tag: 'Mug',         price: '€22' },
  { id: 'coaster-set',             label: 'Atlantic Coaster Set (4)',       kind: 'home',        img: '/Images/merch/vinyl-record-sleeve.jpg',      tag: 'Coasters',    price: '€28' },
  { id: 'throw-blanket',           label: 'Atlantic Noir Throw',           kind: 'home',        img: '/Images/merch/hoodie-sea-soul.jpg',          tag: 'Throw',       price: '€75' },
  { id: 'cushion-sea',             label: '"The Sea" Cushion',              kind: 'home',        img: '/Images/merch/roots-we-cannot-see.jpg',      tag: 'Cushion',     price: '€45' },
  { id: 'diffuser-atlantic',       label: 'Atlantic Noir Reed Diffuser',   kind: 'home',        img: '/Images/merch/mug-atlantic-dawn.jpg',        tag: 'Diffuser',    price: '€38' },

  // ── Accessories ──────────────────────────────────────────────────────────
  { id: 'tote-roots',              label: 'Roots Tote Bag',                kind: 'accessories', img: '/Images/merch/tote-roots.jpg',               tag: 'Tote Bag',    price: '€30' },
  { id: 'tote-borrowed-time',      label: '"Borrowed Time" Tote',          kind: 'accessories', img: '/Images/merch/tote-borrowed-time.jpg',       tag: 'Tote Bag',    price: '€30' },
  { id: 'cap-nc-monogram',         label: 'NC Monogram Cap',               kind: 'accessories', img: '/Images/merch/cap-nc-monogram.jpg',          tag: 'Cap',         price: '€32' },
  { id: 'cap-atlantic-noir',       label: '"Atlantic Noir" Cap',           kind: 'accessories', img: '/Images/merch/cap-atlantic-noir.jpg',        tag: 'Cap',         price: '€32' },
  { id: 'phone-case-atlantic',     label: 'Atlantic Phone Case',           kind: 'accessories', img: '/Images/merch/phone-case-atlantic.jpg',      tag: 'Phone Case',  price: '€25' },
  { id: 'phone-case-roots',        label: '"Roots" Phone Case',            kind: 'accessories', img: '/Images/merch/phone-case-roots.jpg',         tag: 'Phone Case',  price: '€25' },
  { id: 'sticker-diamond-mark',    label: 'Diamond Mark Sticker',          kind: 'accessories', img: '/Images/merch/sticker-diamond-mark.jpg',     tag: 'Sticker',     price: '€8' },
  { id: 'keyring-nc',              label: 'NoiraCiel Key Ring',             kind: 'accessories', img: '/Images/merch/sticker-diamond-mark.jpg',    tag: 'Key Ring',    price: '€15' },
  { id: 'patch-set',               label: 'Embroidered Patch Set',         kind: 'accessories', img: '/Images/merch/sticker-diamond-mark.jpg',    tag: 'Patches',     price: '€18' },
  { id: 'backpack-atlantic',       label: 'Atlantic Noir Backpack',        kind: 'accessories', img: '/Images/merch/tote-roots.jpg',               tag: 'Backpack',    price: '€90' },

  // ── Print & Art ──────────────────────────────────────────────────────────
  { id: 'poster-why',              label: '"Why" Cinematic Poster',        kind: 'print',       img: '/Images/merch/poster-why.jpg',               tag: 'Poster',      price: '€30' },
  { id: 'poster-life-lessons',     label: 'Album Declaration Poster',      kind: 'print',       img: '/Images/merch/poster-life-lessons.jpg',      tag: 'Poster',      price: '€30' },
  { id: 'life-lessons-cover',      label: 'Album Cover Art Print',         kind: 'print',       img: '/Images/album-cover.png',                    tag: 'Art Print',   price: '€45' },
  { id: 'noiraciel-crest',         label: 'Heritage Crest Print',          kind: 'print',       img: '/Images/merch/noiraciel-crest.jpg',          tag: 'Art Print',   price: '€45' },
  { id: 'borrowed-time-print',     label: '"Borrowed Time" Art Print',     kind: 'print',       img: '/Images/merch/borrowed-time.jpg',            tag: 'Art Print',   price: '€45' },
  { id: 'vinyl-record-sleeve',     label: 'Vinyl Record Sleeve',           kind: 'print',       img: '/Images/merch/vinyl-record-sleeve.jpg',      tag: 'Vinyl',       price: '€40' },
  { id: 'signed-album-print',      label: 'Signed Limited Print (1/50)',   kind: 'print',       img: '/Images/album-cover.png',                    tag: 'Limited',     price: '€120' },
  { id: 'postcard-set',            label: 'Atlantic Noir Postcard Set',    kind: 'print',       img: '/Images/merch/poster-why.jpg',               tag: 'Postcards',   price: '€16' },

  // ── Stationery ────────────────────────────────────────────────────────────
  { id: 'journal-atlantic',        label: 'Atlantic Journal',              kind: 'stationery',  img: '/Images/merch/poster-life-lessons.jpg',      tag: 'Journal',     price: '€28' },
  { id: 'notebook-lyrics',         label: 'Lyric Notes Notebook',          kind: 'stationery',  img: '/Images/merch/poster-life-lessons.jpg',      tag: 'Notebook',    price: '€20' },
  { id: 'bookmarks',               label: 'Atlantic Bookmark Set (5)',     kind: 'stationery',  img: '/Images/merch/sticker-diamond-mark.jpg',    tag: 'Bookmarks',   price: '€12' },
  { id: 'greeting-cards',          label: '"Life Lessons" Card Set (8)',   kind: 'stationery',  img: '/Images/merch/poster-why.jpg',               tag: 'Cards',       price: '€20' },
  { id: 'gift-box',                label: 'NoiraCiel Gift Box',            kind: 'stationery',  img: '/Images/album-cover.png',                    tag: 'Gift Set',    price: '€95' },
]

const FILTERS: { label: string; value: MerchKind; count?: number }[] = [
  { label: 'All',             value: 'all' },
  { label: 'Apparel',         value: 'apparel' },
  { label: 'Home & Candles',  value: 'home' },
  { label: 'Print & Art',     value: 'print' },
  { label: 'Accessories',     value: 'accessories' },
  { label: 'Stationery',      value: 'stationery' },
]

function MerchCard({ item }: { item: typeof MERCH_ITEMS[0] }) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true)
  }, [])

  const isLimited = item.tag === 'Limited'
  const isCandleSet = item.tag === 'Candle Set' || item.tag === 'Gift Set'

  return (
    <div className="group relative overflow-hidden bg-noir-deep border border-noir-silver/6 hover:border-noir-gold/25 transition-all duration-500">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={item.img}
          alt={item.label}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!loaded && <div className="absolute inset-0 bg-noir-deep/80 animate-pulse" />}
        <div className="absolute inset-0 bg-gradient-to-t from-noir-void/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="font-body text-[8px] tracking-[0.3em] text-noir-silver/50 bg-noir-void/70 border border-noir-silver/10 px-2 py-0.5 uppercase">
            {item.tag}
          </span>
          {isLimited && (
            <span className="font-body text-[8px] tracking-[0.2em] text-noir-gold bg-noir-void/80 border border-noir-gold/30 px-2 py-0.5 uppercase">
              Limited
            </span>
          )}
        </div>

        {/* Price */}
        <div className="absolute top-3 right-3">
          <span className="font-body text-[10px] tracking-[0.15em] text-noir-gold/80 bg-noir-void/70 px-2 py-0.5">
            {item.price}
          </span>
        </div>

        {/* Enquire overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a
            href="#contact"
            className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-gold border border-noir-gold/50 px-4 py-2 bg-noir-void/80 hover:bg-noir-gold hover:text-noir-void transition-all duration-300"
          >
            Order
          </a>
        </div>
      </div>

      {/* Label */}
      <div className="px-3 py-3 flex items-start justify-between gap-2">
        <p className="font-heading italic text-sm text-noir-ivory/75 leading-tight">{item.label}</p>
        {isCandleSet && (
          <span className="text-[9px] font-body text-noir-gold/50 tracking-wide whitespace-nowrap">Best Value</span>
        )}
      </div>
    </div>
  )
}

// ── Candle Feature Card ────────────────────────────────────────────────────────
function CandleFeature() {
  return (
    <div className="col-span-full lg:col-span-2 bg-gradient-to-br from-noir-navy/30 via-noir-deep to-noir-deep border border-noir-gold/12 p-8 flex flex-col sm:flex-row gap-8 items-start">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 border border-noir-gold/30 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 4 C14 4 10 8 10 12 C10 14.2 11.8 16 14 16 C16.2 16 18 14.2 18 12 C18 8 14 4 14 4Z" stroke="#C4953A" strokeWidth="0.8" fill="none" opacity="0.7"/>
            <rect x="11" y="16" width="6" height="9" stroke="#C4953A" strokeWidth="0.7" fill="none" opacity="0.5"/>
            <line x1="14" y1="2" x2="14" y2="4" stroke="#C4953A" strokeWidth="1" opacity="0.9"/>
          </svg>
        </div>
      </div>
      <div>
        <p className="font-body text-[9px] tracking-[0.45em] text-noir-gold/55 uppercase mb-2">Exclusive</p>
        <h3 className="font-heading text-2xl text-noir-ivory/90 mb-3">Atlantic Noir Candles</h3>
        <p className="font-body text-xs text-noir-silver/50 leading-relaxed max-w-sm">
          Hand-poured soy candles inspired by the album's emotional landscape. Each scent is a chapter: ocean salt, cedar and rain, old wood and memory. Burn them while you listen.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {['Atlantic Night · Ocean & Salt', 'Leave A Light On · Cedar & Warmth', 'Memory · Sandalwood & Rain'].map((s) => (
            <span key={s} className="font-body text-[9px] tracking-[0.2em] text-noir-silver/40 border border-noir-silver/10 px-3 py-1">{s}</span>
          ))}
        </div>
        <a href="#contact" className="inline-flex mt-5 font-body text-xs tracking-[0.25em] uppercase text-noir-gold border border-noir-gold/40 px-5 py-2.5 hover:bg-noir-gold hover:text-noir-void transition-all duration-300">
          Enquire about candles
        </a>
      </div>
    </div>
  )
}

export default function MerchSection() {
  const [filter, setFilter] = useState<MerchKind>('all')

  const visible = filter === 'all' ? MERCH_ITEMS : MERCH_ITEMS.filter((i) => i.kind === filter)

  const filterCounts = FILTERS.map((f) => ({
    ...f,
    count: f.value === 'all' ? MERCH_ITEMS.length : MERCH_ITEMS.filter((i) => i.kind === f.value).length,
  }))

  return (
    <section id="merch" className="py-28 px-6 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(196,149,58,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-body text-[9px] tracking-[0.5em] text-noir-gold/55 uppercase mb-3">The Shop</p>
            <h2 className="font-heading text-5xl md:text-7xl text-noir-ivory font-light tracking-wide">
              Wear the Universe
            </h2>
            <p className="font-body text-sm text-noir-silver/40 mt-3 max-w-md leading-relaxed">
              Art objects for people who carry their feelings carefully. Every piece is produced to order.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {filterCounts.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`font-body text-[9px] tracking-[0.18em] uppercase px-3 py-2 transition-all duration-200 ${
                  filter === f.value
                    ? 'text-noir-gold border-b border-noir-gold'
                    : 'text-noir-silver/35 hover:text-noir-silver/60 border-b border-transparent'
                }`}
              >
                {f.label}
                <span className="ml-1 opacity-40">({f.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Candle feature — always show when viewing all or home */}
        {(filter === 'all' || filter === 'home') && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-3">
            <CandleFeature />
            {MERCH_ITEMS.filter(i => i.kind === 'home').slice(0, 2).map(item => (
              <MerchCard key={item.id + '-feature'} item={item} />
            ))}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {visible.map((item) => (
            <MerchCard key={item.id} item={item} />
          ))}
        </div>

        {/* Order note */}
        <div className="mt-12 border border-noir-silver/8 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-heading italic text-base text-noir-ivory/60 mb-1">
              {MERCH_ITEMS.length} pieces · Produced to order
            </p>
            <p className="font-body text-xs text-noir-silver/35">
              Limited quantities. Each item ships within 7–14 days. Use the contact form for custom orders, bundles, and wholesale enquiries.
            </p>
          </div>
          <a
            href="#contact"
            className="flex-shrink-0 font-body text-xs tracking-[0.25em] uppercase text-noir-gold border border-noir-gold/40 px-6 py-3 hover:bg-noir-gold hover:text-noir-void transition-all duration-300 whitespace-nowrap"
          >
            Order enquiry
          </a>
        </div>
      </div>
    </section>
  )
}
