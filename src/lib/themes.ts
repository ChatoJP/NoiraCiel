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
    accentRgb: '176, 88, 108',
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
}

export function getThemeForAlbum(albumSlug: string | null | undefined): ThemeName {
  if (!albumSlug) return 'dark-noir'
  return ALBUM_THEMES[albumSlug] ?? 'dark-noir'
}
