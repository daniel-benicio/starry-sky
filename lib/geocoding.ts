import type { Coordinates } from "./types"

const CITY_COORDINATES: Record<string, Coordinates> = {
  // Brasil — Sul/Sudeste
  "são paulo":       { lat: -23.5505, lon: -46.6333, displayName: "São Paulo" },
  "sao paulo":       { lat: -23.5505, lon: -46.6333, displayName: "São Paulo" },
  "sp":              { lat: -23.5505, lon: -46.6333, displayName: "São Paulo" },
  "rio de janeiro":  { lat: -22.9068, lon: -43.1729, displayName: "Rio de Janeiro" },
  "rio":             { lat: -22.9068, lon: -43.1729, displayName: "Rio de Janeiro" },
  "rj":              { lat: -22.9068, lon: -43.1729, displayName: "Rio de Janeiro" },
  "belo horizonte":  { lat: -19.9167, lon: -43.9345, displayName: "Belo Horizonte" },
  "bh":              { lat: -19.9167, lon: -43.9345, displayName: "Belo Horizonte" },
  "curitiba":        { lat: -25.4297, lon: -49.2711, displayName: "Curitiba" },
  "porto alegre":    { lat: -30.0277, lon: -51.2287, displayName: "Porto Alegre" },
  "campinas":        { lat: -22.9056, lon: -47.0608, displayName: "Campinas" },
  "santos":          { lat: -23.9608, lon: -46.3336, displayName: "Santos" },
  "florianópolis":   { lat: -27.5954, lon: -48.5480, displayName: "Florianópolis" },
  "florianopolis":   { lat: -27.5954, lon: -48.5480, displayName: "Florianópolis" },
  "joinville":       { lat: -26.3044, lon: -48.8487, displayName: "Joinville" },
  "londrina":        { lat: -23.3045, lon: -51.1696, displayName: "Londrina" },
  "maringá":         { lat: -23.4205, lon: -51.9333, displayName: "Maringá" },
  "maringa":         { lat: -23.4205, lon: -51.9333, displayName: "Maringá" },
  "vitória":         { lat: -20.3222, lon: -40.3381, displayName: "Vitória" },
  "vitoria":         { lat: -20.3222, lon: -40.3381, displayName: "Vitória" },
  "uberlândia":      { lat: -18.9186, lon: -48.2772, displayName: "Uberlândia" },
  "uberlandia":      { lat: -18.9186, lon: -48.2772, displayName: "Uberlândia" },
  // Brasil — Centro-Oeste/Norte/Nordeste
  "brasília":        { lat: -15.7801, lon: -47.9292, displayName: "Brasília" },
  "brasilia":        { lat: -15.7801, lon: -47.9292, displayName: "Brasília" },
  "df":              { lat: -15.7801, lon: -47.9292, displayName: "Brasília" },
  "salvador":        { lat: -12.9714, lon: -38.5014, displayName: "Salvador" },
  "recife":          { lat:  -8.0539, lon: -34.8811, displayName: "Recife" },
  "fortaleza":       { lat:  -3.7172, lon: -38.5433, displayName: "Fortaleza" },
  "manaus":          { lat:  -3.1019, lon: -60.0250, displayName: "Manaus" },
  "belém":           { lat:  -1.4558, lon: -48.5044, displayName: "Belém" },
  "belem":           { lat:  -1.4558, lon: -48.5044, displayName: "Belém" },
  "natal":           { lat:  -5.7945, lon: -35.2110, displayName: "Natal" },
  "maceió":          { lat:  -9.6658, lon: -35.7350, displayName: "Maceió" },
  "maceio":          { lat:  -9.6658, lon: -35.7350, displayName: "Maceió" },
  "são luís":        { lat:  -2.5297, lon: -44.3028, displayName: "São Luís" },
  "sao luis":        { lat:  -2.5297, lon: -44.3028, displayName: "São Luís" },
  "teresina":        { lat:  -5.0919, lon: -42.8034, displayName: "Teresina" },
  "campo grande":    { lat: -20.4697, lon: -54.6201, displayName: "Campo Grande" },
  "cuiabá":          { lat: -15.6010, lon: -56.0974, displayName: "Cuiabá" },
  "cuiaba":          { lat: -15.6010, lon: -56.0974, displayName: "Cuiabá" },
  "goiânia":         { lat: -16.6869, lon: -49.2648, displayName: "Goiânia" },
  "goiania":         { lat: -16.6869, lon: -49.2648, displayName: "Goiânia" },
  "porto velho":     { lat:  -8.7619, lon: -63.9039, displayName: "Porto Velho" },
  "joão pessoa":     { lat:  -7.1195, lon: -34.8450, displayName: "João Pessoa" },
  "joao pessoa":     { lat:  -7.1195, lon: -34.8450, displayName: "João Pessoa" },
  "aracaju":         { lat: -10.9472, lon: -37.0731, displayName: "Aracaju" },
  "macapá":          { lat:   0.0349, lon: -51.0694, displayName: "Macapá" },
  "macapa":          { lat:   0.0349, lon: -51.0694, displayName: "Macapá" },
  // Internacionais
  "buenos aires":    { lat: -34.6037, lon: -58.3816, displayName: "Buenos Aires" },
  "santiago":        { lat: -33.4489, lon: -70.6693, displayName: "Santiago" },
  "lima":            { lat: -12.0464, lon: -77.0428, displayName: "Lima" },
  "bogotá":          { lat:   4.7110, lon: -74.0721, displayName: "Bogotá" },
  "bogota":          { lat:   4.7110, lon: -74.0721, displayName: "Bogotá" },
  "new york":        { lat:  40.7128, lon: -74.0060, displayName: "New York" },
  "nova york":       { lat:  40.7128, lon: -74.0060, displayName: "Nova York" },
  "london":          { lat:  51.5074, lon:  -0.1278, displayName: "London" },
  "londres":         { lat:  51.5074, lon:  -0.1278, displayName: "Londres" },
  "paris":           { lat:  48.8566, lon:   2.3522, displayName: "Paris" },
  "madrid":          { lat:  40.4168, lon:  -3.7038, displayName: "Madrid" },
  "lisboa":          { lat:  38.7223, lon:  -9.1393, displayName: "Lisboa" },
  "roma":            { lat:  41.9028, lon:  12.4964, displayName: "Roma" },
  "rome":            { lat:  41.9028, lon:  12.4964, displayName: "Rome" },
  "tokyo":           { lat:  35.6762, lon: 139.6503, displayName: "Tokyo" },
  "dubai":           { lat:  25.2048, lon:  55.2708, displayName: "Dubai" },
  "sydney":          { lat: -33.8688, lon: 151.2093, displayName: "Sydney" },
}

export function geocodeCity(input: string): Coordinates | null {
  const normalized = input.toLowerCase().trim().replace(/,.*$/, "").trim()

  const exact = CITY_COORDINATES[normalized]
  if (exact) return exact

  const partial = Object.entries(CITY_COORDINATES).find(
    ([key]) => normalized.includes(key) || key.includes(normalized),
  )
  if (partial) return partial[1]

  return null
}
