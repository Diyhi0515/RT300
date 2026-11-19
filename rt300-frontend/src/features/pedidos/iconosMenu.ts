import {
  Beer,
  Cake,
  Citrus,
  Coffee,
  Cookie,
  Gift,
  GlassWater,
  IceCreamCone,
  Martini,
  PartyPopper,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react'

const REGLAS: [RegExp, LucideIcon][] = [
  [/ALCOH|LICOR|WHISK|RON\b|VODKA|TRAGO|COCTEL/, Martini],
  [/VINO/, Wine],
  [/CERVEZA|BIER/, Beer],
  [/JUGO|NATURAL|FRUTA/, Citrus],
  [/GASEOSA|AGUA|BEBIDA|GATORADE/, GlassWater],
  [/CAFE|TE\b|INFUSION/, Coffee],
  [/GALLETA|HELADO|SNACK/, Cookie],
  [/HELADO/, IceCreamCone],
  [/PASTEL|POSTRE|TORTA|DULCE/, Cake],
  [/PIZZA/, Pizza],
  [/SANDWICH|HAMBURG|SALTE/, Sandwich],
  [/SOPA|CALDO/, Soup],
  [/ENSALADA/, Salad],
  [/FIESTA|CARNAVAL|SAN JUAN|EVENTO|NAVIDAD|AÑO NUEVO|DIA DE/, PartyPopper],
  [/COMPLEMENT|ADICIONAL|EXTRA/, Gift],
  [/COMIDA|PLATO|PARRILLA|CARNE|DESCORCHE/, UtensilsCrossed],
]

export const iconoDeSeccion = (nombre: string): LucideIcon => {
  const buscado = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  return REGLAS.find(([patron]) => patron.test(buscado))?.[1] ?? Utensils
}
