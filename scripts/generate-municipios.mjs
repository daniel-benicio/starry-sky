/**
 * Gera public/municipios-br.json com todos os 5.570 municípios brasileiros.
 *
 * Fonte: IBGE API — Localidades
 * https://servicodados.ibge.gov.br/api/v1/localidades/municipios
 *
 * Execute: node scripts/generate-municipios.mjs
 */

import { writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT    = join(__dirname, "../public/municipios-br.json")
const IBGE_URL  = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome"

console.log("⬇  Buscando municípios no IBGE...")

const res  = await fetch(IBGE_URL)
const data = await res.json()

console.log(`✓  ${data.length} municípios recebidos`)

// Extrai apenas nome + sigla do estado.
// Fallback para regiao-imediata nos (raros) municípios sem microrregiao.
const municipios = data.map((m) => ({
  nome: m.nome,
  uf:   m.microrregiao?.mesorregiao?.UF?.sigla
     ?? m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla
     ?? "BR",
}))

writeFileSync(OUTPUT, JSON.stringify(municipios), "utf-8")
console.log(`✓  Arquivo gerado: public/municipios-br.json (${municipios.length} municípios)`)
