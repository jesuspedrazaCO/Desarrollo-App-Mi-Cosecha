// Ficha de campos de venta por tipo de cultivo.
//
// `varieties` es el menú de CALIDAD / clasificación del producto al vender
// (ej: Piña pareja, Mango de primera). Se llama así en el código por historia.
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
    varieties: ['Piña gruesa', 'Piña pareja', 'Piña pipo', 'Piña riche', 'Piña racha'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'canastillas', 'unidades'],
    showCrates: true,
  },
  'Tomate': {
    varieties: ['Tomate de primera', 'Tomate de segunda', 'Tomate de tercera'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'canastillas'],
    showCrates: true,
  },
  'Patilla': {
    varieties: ['Patilla de primera', 'Patilla de segunda', 'Patilla de tercera'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'unidades'],
    showCrates: true,
  },
  'Mango': {
    varieties: ['Mango de primera', 'Mango de segunda', 'Mango de tercera'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'canastillas', 'unidades'],
    showCrates: true,
  },
  'Aguacate': {
    varieties: ['Aguacate de primera', 'Aguacate de segunda', 'Aguacate de tercera'],
    defaultUnit: 'kg',
    unitSuggestions: ['kg', 'canastillas', 'unidades'],
    showCrates: true,
  },
  'Plátano': {
    varieties: ['Plátano de primera', 'Plátano de segunda', 'Plátano de tercera'],
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
    varieties: ['Yuca de primera', 'Yuca de segunda', 'Yuca de tercera'],
    defaultUnit: 'bultos',
    unitSuggestions: ['bultos', 'kg', 'arrobas'],
    showCrates: false,
  },
  'Papa': {
    varieties: ['Papa de primera', 'Papa de segunda', 'Papa de tercera'],
    defaultUnit: 'bultos',
    unitSuggestions: ['bultos', 'kg', 'arrobas'],
    showCrates: false,
  },
  'Café': {
    varieties: ['Café pergamino', 'Café cereza', 'Café excelso', 'Café pasilla'],
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
    varieties: ['Arroz paddy verde', 'Arroz paddy seco', 'Arroz blanco'],
    defaultUnit: 'bultos',
    unitSuggestions: ['bultos', 'kg', 'toneladas'],
    showCrates: false,
  },
  'Tabaco': {
    varieties: ['Tabaco negro', 'Tabaco rubio', 'Tabaco burley'],
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