// Ficha de campos de venta por tipo de cultivo.
//
// El modelo de datos (Income) ya es genérico — `variety`, `unit` y `crates`
// son campos de texto libre, no un esquema distinto por fruta — así que esto
// NO cambia nada en el backend ni en los datos ya guardados. Solo cambia qué
// sugerencias y qué campos se muestran en el formulario "Registrar ingreso"
// según el `type` del cultivo seleccionado.
//
// Para agregar una fruta nueva con sus propias variedades/unidad, solo hay
// que agregar una entrada aquí — no hay que tocar el formulario ni el modelo.
export const CROP_FIELD_PRESETS = {
  'Piña': {
    varieties: ['Piña gruesa', 'Piña pareja', 'Pipo', 'Riche', 'Racha'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'canastillas', 'unidades'],
    showCrates: true,
  },
  'Tomate': {
    varieties: ['Tomate chonto', 'Tomate milano', 'Tomate larga vida', 'Tomate cherry', 'Tomate riñón'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'canastillas'],
    showCrates: true,
  },
  'Patilla': {
    varieties: ['Patilla rayada', 'Patilla negra', 'Patilla baby'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'unidades'],
    showCrates: true,
  },
  'Mango': {
    varieties: ['Mango de azúcar', 'Mango Tommy', 'Mango Keitt', 'Mango criollo'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'canastillas', 'unidades'],
    showCrates: true,
  },
  'Aguacate': {
    varieties: ['Aguacate Hass', 'Aguacate papelillo', 'Aguacate criollo'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'canastillas', 'unidades'],
    showCrates: true,
  },
  'Plátano': {
    varieties: ['Plátano verde', 'Plátano maduro', 'Plátano hartón', 'Plátano dominico'],
    defaultUnit: 'racimos',
    unitSuggestions: ['racimos', 'kg', 'unidades'],
    showCrates: false,
  },
  'Maíz': {
    varieties: ['Maíz amarillo', 'Maíz blanco', 'Maíz mazorca'],
    defaultUnit: 'bultos',
    unitSuggestions: ['bultos', 'kg', 'arrobas'],
    showCrates: false,
  },
  'Yuca': {
    varieties: ['Yuca brasilera', 'Yuca llanera', 'Yuca criolla'],
    defaultUnit: 'bultos',
    unitSuggestions: ['bultos', 'kg', 'arrobas'],
    showCrates: false,
  },
  'Papa': {
    varieties: ['Papa pastusa', 'Papa criolla', 'Papa R12', 'Papa única'],
    defaultUnit: 'bultos',
    unitSuggestions: ['bultos', 'kg', 'arrobas'],
    showCrates: false,
  },
  'Café': {
    varieties: ['Café pergamino', 'Café cereza', 'Café excelso'],
    defaultUnit: 'arrobas',
    unitSuggestions: ['arrobas', 'kg', 'bultos'],
    showCrates: false,
  },
  'Cacao': {
    varieties: ['Cacao en baba', 'Cacao seco', 'Cacao en grano'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'arrobas', 'bultos'],
    showCrates: false,
  },
  'Arroz': {
    varieties: ['Arroz blanco', 'Arroz paddy'],
    defaultUnit: 'bultos',
    unitSuggestions: ['bultos', 'kg', 'toneladas'],
    showCrates: false,
  },
  'Tabaco': {
    varieties: ['Tabaco negro', 'Tabaco rubio'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'bultos'],
    showCrates: false,
  },
}

// Para "Otro" o cualquier tipo que no esté en la lista de arriba.
export const DEFAULT_FIELD_PRESET = {
  varieties: [],
  defaultUnit: 'kg',
  unitSuggestions: ['kg', 'unidades', 'bultos', 'arrobas'],
  showCrates: true,
}

export function getCropFieldPreset(cropType) {
  return CROP_FIELD_PRESETS[cropType] || DEFAULT_FIELD_PRESET
}