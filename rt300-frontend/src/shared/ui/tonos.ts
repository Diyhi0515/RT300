export type Tono = 'info' | 'success' | 'warning' | 'danger' | 'club' | 'clubAlert'

interface ClasesTono {
  text: string
  soft: string
  bar: string
  solid: string
}

export const tonos: Record<Tono, ClasesTono> = {
  info: {
    text: 'text-primary',
    soft: 'bg-primary/10',
    bar: 'bg-primary',
    solid: 'bg-primary text-white',
  },
  success: {
    text: 'text-success',
    soft: 'bg-success/10',
    bar: 'bg-success',
    solid: 'bg-success text-white',
  },
  warning: {
    text: 'text-accent-solid',
    soft: 'bg-accent-solid/15',
    bar: 'bg-accent-solid',
    solid: 'bg-accent-solid text-black',
  },
  danger: {
    text: 'text-danger',
    soft: 'bg-danger/10',
    bar: 'bg-danger',
    solid: 'bg-danger text-white',
  },
  club: {
    text: 'text-club-primary',
    soft: 'bg-club-container',
    bar: 'bg-club-pc',
    solid: 'bg-club-pc text-white',
  },
  clubAlert: {
    text: 'text-club-error',
    soft: 'bg-club-error-c',
    bar: 'bg-club-error',
    solid: 'bg-club-error text-white',
  },
}
