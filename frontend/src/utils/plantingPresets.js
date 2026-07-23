// Valores de referencia (metros). Son promedios generales — varían según
// variedad, clima, técnica de siembra y región. El usuario siempre puede
// ajustarlos manualmente.
export const PLANTING_PRESETS = {
  pina:     { label: 'Piña',                rowSpacing: 1,   plantSpacing: 0.3 },
  tomate:   { label: 'Tomate',              rowSpacing: 1.2, plantSpacing: 0.4 },
  patilla:  { label: 'Patilla (sandía)',    rowSpacing: 2.5, plantSpacing: 1 },
  tabaco:   { label: 'Tabaco',              rowSpacing: 1,   plantSpacing: 0.5 },
  cafe:     { label: 'Café',                rowSpacing: 1.5, plantSpacing: 1 },
  maiz:     { label: 'Maíz',                rowSpacing: 0.8, plantSpacing: 0.25 },
  yuca:     { label: 'Yuca',                rowSpacing: 1,   plantSpacing: 0.8 },
  papa:     { label: 'Papa',                rowSpacing: 0.9, plantSpacing: 0.3 },
  aguacate: { label: 'Aguacate',            rowSpacing: 7,   plantSpacing: 7 },
  platano:  { label: 'Plátano',             rowSpacing: 3,   plantSpacing: 3 },
  otro:     { label: 'Otro / personalizado', rowSpacing: 1,  plantSpacing: 0.5 },
}