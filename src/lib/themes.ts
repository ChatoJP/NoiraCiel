export const THEME_NAMES = [
  'dark-noir',
  'atlantic-blue',
  'violet-red',
  'ritual-amber',
  'emerald-soul',
  'cyber-cathedral',
  'reggae-dub',
  'intimate-metal',
  'sacred-drift',
  'salt-cathedral',
  'neon-saints',
  'glass-animal',
  'black-sun-gospel',
  'the-memory-atlas',
  'ritual-voltage',
  'concrete-saints',
  'velvet-circuit',
  'drum-oracle',
] as const

export type ThemeName = (typeof THEME_NAMES)[number]

export interface ThemeDefinition {
  name: ThemeName
  label: string
  accentRgb: string   // "R, G, B"
  bgTintRgb: string   // subtle background tint "R, G, B"
  mood: string
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  'dark-noir': {
    name: 'dark-noir',
    label: 'Dark Noir',
    accentRgb: '196, 149, 58',
    bgTintRgb: '8, 8, 16',
    mood: 'premium · silent · cinematic',
  },
  'atlantic-blue': {
    name: 'atlantic-blue',
    label: 'Atlantic Blue',
    accentRgb: '107, 158, 190',
    bgTintRgb: '11, 26, 48',
    mood: 'ocean · memory · distance',
  },
  'violet-red': {
    name: 'violet-red',
    label: 'Violet Red',
    // Lightened +16% from the original 176,88,108 — that pairing was 3.90:1
    // against its background tint, failing WCAG AA for small text (4.5:1
    // minimum). This reaches 5.04:1 while keeping the same wine-red hue.
    accentRgb: '204, 102, 125',
    bgTintRgb: '40, 10, 20',
    mood: 'sensual · dramatic · nocturnal',
  },
  'ritual-amber': {
    name: 'ritual-amber',
    label: 'Ritual Amber',
    accentRgb: '196, 133, 52',
    bgTintRgb: '40, 20, 5',
    mood: 'sacred · tribal · firelight',
  },
  'emerald-soul': {
    name: 'emerald-soul',
    label: 'Emerald Soul',
    accentRgb: '82, 148, 112',
    bgTintRgb: '8, 25, 18',
    mood: 'organic · soul · human',
  },
  'cyber-cathedral': {
    name: 'cyber-cathedral',
    label: 'Cyber Cathedral',
    accentRgb: '99, 128, 196',
    bgTintRgb: '8, 14, 45',
    mood: 'machine · cathedral · future',
  },
  'reggae-dub': {
    name: 'reggae-dub',
    label: 'Reggae Dub',
    accentRgb: '176, 155, 58',
    bgTintRgb: '18, 22, 5',
    mood: 'roots · earth · smoke',
  },
  'intimate-metal': {
    name: 'intimate-metal',
    label: 'Intimate Metal',
    accentRgb: '148, 164, 178',
    bgTintRgb: '14, 18, 22',
    mood: 'heavy · sacred · intimate',
  },
  'sacred-drift': {
    name: 'sacred-drift',
    label: 'Sacred Drift',
    accentRgb: '148, 118, 192',
    bgTintRgb: '22, 8, 38',
    mood: 'drifting · psych · soul',
  },
  'salt-cathedral': {
    name: 'salt-cathedral',
    label: 'The Salt Cathedral',
    accentRgb: '196, 149, 58',
    bgTintRgb: '10, 20, 32',
    mood: 'atlantic noir · sea-soul · exile',
  },
  'neon-saints': {
    name: 'neon-saints',
    label: 'Neon Saints of the Machine',
    accentRgb: '63, 184, 201',
    bgTintRgb: '26, 8, 20',
    mood: 'cyber-soul · industrial gospel',
  },
  'glass-animal': {
    name: 'glass-animal',
    label: 'The Glass Animal',
    accentRgb: '217, 184, 190',
    bgTintRgb: '30, 24, 26',
    mood: 'chamber soul · fragile pop',
  },
  'black-sun-gospel': {
    name: 'black-sun-gospel',
    label: 'Black Sun Gospel',
    // Lightened from 181,72,30 (3.61:1, fails WCAG AA) to 214,108,58 (5.61:1).
    accentRgb: '214, 108, 58',
    bgTintRgb: '14, 13, 13',
    mood: 'dark soul · cinematic gospel',
  },
  'the-memory-atlas': {
    name: 'the-memory-atlas',
    label: 'The Memory Atlas',
    accentRgb: '185, 143, 74',
    bgTintRgb: '26, 22, 16',
    mood: 'cinematic folk · puzzle-pop',
  },
  'ritual-voltage': {
    name: 'ritual-voltage',
    label: 'Ritual Voltage',
    accentRgb: '127, 224, 112',
    bgTintRgb: '20, 12, 28',
    mood: 'psy-trance · ritual · physical',
  },
  'concrete-saints': {
    name: 'concrete-saints',
    label: 'Concrete Saints',
    accentRgb: '232, 234, 236',
    bgTintRgb: '12, 12, 14',
    mood: 'hard techno · industrial · brutal elegance',
  },
  'velvet-circuit': {
    name: 'velvet-circuit',
    label: 'Velvet Circuit',
    accentRgb: '212, 168, 75',
    bgTintRgb: '20, 14, 22',
    mood: 'tech-house · nocturnal · groove',
  },
  'drum-oracle': {
    name: 'drum-oracle',
    label: 'The Drum Oracle',
    accentRgb: '217, 114, 46',
    bgTintRgb: '24, 16, 12',
    mood: 'tribal house · warm · collective',
  },
}

// Album slug → theme
export const ALBUM_THEMES: Record<string, ThemeName> = {
  'main':                     'atlantic-blue',
  'jazz-sessions':            'violet-red',
  'reggae-sessions':          'reggae-dub',
  'blind-angel':              'intimate-metal',
  'the-velvet-machine':       'cyber-cathedral',
  'still-we-sail':            'atlantic-blue',
  'whats-youre-made-of':      'violet-red',
  'the-sacred-drift':         'sacred-drift',
  'funk-my-way-in':           'ritual-amber',
  'world-musics':             'emerald-soul',
  'salt-cathedral':           'salt-cathedral',
  'neon-saints':              'neon-saints',
  'glass-animal':             'glass-animal',
  'black-sun-gospel':         'black-sun-gospel',
  'the-memory-atlas':         'the-memory-atlas',
  'ritual-voltage':           'ritual-voltage',
  'concrete-saints':          'concrete-saints',
  'velvet-circuit':           'velvet-circuit',
  'drum-oracle':              'drum-oracle',
}

export function getThemeForAlbum(albumSlug: string | null | undefined): ThemeName {
  if (!albumSlug) return 'dark-noir'
  return ALBUM_THEMES[albumSlug] ?? 'dark-noir'
}
