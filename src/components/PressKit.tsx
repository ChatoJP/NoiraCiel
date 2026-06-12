'use client'

const assets = [
  { type: 'bio', title: 'Official Biography', description: 'Short and long form artist biography', icon: '✦', ext: 'PDF' },
  { type: 'logo', title: 'Logo Pack', description: 'SVG, PNG — light and dark versions', icon: '◆', ext: 'ZIP' },
  { type: 'photo', title: 'Press Photos', description: 'High-resolution artist photography', icon: '◯', ext: 'ZIP' },
  { type: 'rider', title: 'Technical Rider', description: 'Stage setup and requirements', icon: '~', ext: 'PDF' },
]

export default function PressKit() {
  return (
    <section id="press" className="py-24 px-6 bg-gradient-to-b from-transparent to-noir-deep/30">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-body text-xs tracking-[0.35em] text-noir-gold/60 uppercase mb-4">Media</p>
            <h2 className="font-heading text-5xl md:text-6xl text-noir-ivory font-light tracking-wide">
              Press Kit
            </h2>
          </div>
          <p className="font-body text-sm text-noir-silver/50 max-w-xs">
            For press enquiries, booking, and collaboration requests. All assets are available for editorial use.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.type}
              className="group border border-noir-silver/10 hover:border-noir-gold/30 p-6 transition-all duration-300 cursor-pointer bg-noir-deep/20 hover:bg-noir-deep/40"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="text-2xl text-noir-gold/40 group-hover:text-noir-gold/60 transition-colors">
                  {asset.icon}
                </span>
                <span className="font-body text-[9px] tracking-[0.2em] text-noir-silver/30 border border-noir-silver/15 px-1.5 py-0.5">
                  {asset.ext}
                </span>
              </div>
              <p className="font-heading text-base text-noir-ivory mb-2">{asset.title}</p>
              <p className="font-body text-xs text-noir-silver/50">{asset.description}</p>

              <a
                href="#contact"
                className="mt-6 flex items-center gap-2 font-body text-xs text-noir-silver/30 group-hover:text-noir-gold/60 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Request access
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 border border-noir-silver/10 bg-noir-deep/20">
          <p className="font-body text-sm text-noir-silver/60">
            For custom press materials, high-resolution assets, or interview requests, please use the{' '}
            <a href="#contact" className="text-noir-gold/70 hover:text-noir-gold border-b border-noir-gold/30 hover:border-noir-gold transition-colors">
              contact form
            </a>.
          </p>
        </div>
      </div>
    </section>
  )
}
