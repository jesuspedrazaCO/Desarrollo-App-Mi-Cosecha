export const EXPENSE_CATEGORIES = [
  { value: 'semillas', label: 'Semillas', icon: '🌰' },
  { value: 'fertilizantes', label: 'Fertilizantes', icon: '🧪' },
  { value: 'abonos', label: 'Abonos', icon: '💩' },
  { value: 'herbicidas', label: 'Herbicidas', icon: '🌿' },
  { value: 'fungicidas', label: 'Fungicidas', icon: '🍄' },
  { value: 'insecticidas', label: 'Insecticidas', icon: '🐛' },
  { value: 'herramientas', label: 'Herramientas', icon: '🔧' },
  { value: 'maquinaria', label: 'Maquinaria', icon: '🚜' },
  { value: 'combustible', label: 'Combustible', icon: '⛽' },
  { value: 'transporte', label: 'Transporte', icon: '🚚' },
  { value: 'mano_de_obra', label: 'Mano de obra', icon: '👨‍🌾' },
  { value: 'riego', label: 'Riego', icon: '💧' },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: '🛠️' },
  { value: 'otros', label: 'Otros', icon: '📦' },
]

export const HOUSEHOLD_CATEGORIES = [
  { value: 'agua', label: 'Agua', icon: '💧' },
  { value: 'energia', label: 'Energía', icon: '💡' },
  { value: 'gas', label: 'Gas', icon: '🔥' },
  { value: 'internet', label: 'Internet', icon: '📶' },
  { value: 'telefonia', label: 'Telefonía', icon: '📱' },
  { value: 'mercado', label: 'Mercado', icon: '🛒' },
  { value: 'transporte', label: 'Transporte', icon: '🚗' },
  { value: 'educacion', label: 'Educación', icon: '📚' },
  { value: 'salud', label: 'Salud', icon: '⚕️' },
  { value: 'vivienda', label: 'Vivienda', icon: '🏠' },
  { value: 'entretenimiento', label: 'Entretenimiento', icon: '🎬' },
  { value: 'otros', label: 'Otros', icon: '📦' },
]

export const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'credito', label: 'Crédito' },
  { value: 'otro', label: 'Otro' },
]

export const CROP_STATUS = {
  activo: { label: 'Activo', color: 'green' },
  finalizado: { label: 'Finalizado', color: 'gray' },
  suspendido: { label: 'Suspendido', color: 'amber' },
}

export const INCOME_TYPES = [
  { value: 'venta_cosecha', label: 'Venta de cosecha' },
  { value: 'venta_parcial', label: 'Venta parcial' },
  { value: 'otro', label: 'Otro ingreso' },
]

export const EVENT_TYPES = {
  siembra: { label: 'Siembra', icon: '🌱', color: 'green' },
  cosecha: { label: 'Cosecha', icon: '🌾', color: 'accent' },
  pago_pendiente: { label: 'Pago pendiente', icon: '💸', color: 'red' },
  servicio_hogar: { label: 'Servicio del hogar', icon: '🏠', color: 'blue' },
  actividad_agricola: { label: 'Actividad agrícola', icon: '🚜', color: 'green' },
  otro: { label: 'Otro', icon: '📌', color: 'gray' },
}

export const LAND_SIZE_UNITS = [
  { value: 'hectáreas', label: 'Hectáreas' },
  { value: 'metros2', label: 'Metros²' },
  { value: 'cuadras', label: 'Cuadras' },
  { value: 'fanegadas', label: 'Fanegadas' },
]

export const CHART_COLORS = [
  '#2d6f43', '#df7e42', '#5dab74', '#cc6228', '#8fc99e',
  '#a94e1f', '#3d8a56', '#f4c7a3', '#1f462f', '#eba26b',
]