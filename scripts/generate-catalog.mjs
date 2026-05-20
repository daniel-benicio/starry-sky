/**
 * One-time build script: downloads HYG v3 database and generates lib/star-catalog.ts
 *
 * Run: node scripts/generate-catalog.mjs
 *
 * Stars brighter than MAG_LIMIT with a Hipparcos ID are included.
 * Constellation lines use official Hipparcos-based IAU definitions.
 */

import { createWriteStream, createReadStream, readFileSync, writeFileSync } from "fs"
import { pipeline } from "stream/promises"
import { createGunzip } from "zlib"
import { get } from "https"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { createInterface } from "readline"

const __dirname  = dirname(fileURLToPath(import.meta.url))
const ROOT       = join(__dirname, "..")
const TEMP_GZ    = join(ROOT, "scripts", "hyg_v38.csv.gz")
const TEMP_CSV   = join(ROOT, "scripts", "hyg_v38.csv")
const OUTPUT     = join(ROOT, "lib", "star-catalog.ts")

const HYG_URL    = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/v3/hyg_v38.csv.gz"
const MAG_LIMIT  = 6.5   // naked-eye limit

// ---------------------------------------------------------------------------
// Constellation lines: pairs of Hipparcos IDs (Western sky culture / IAU)
// ---------------------------------------------------------------------------
const CONSTELLATION_LINES = {
  And: [[677,5447],[5447,9640],[9640,14135],[14135,3092]],
  Ant: [[51172,48926],[48926,46706]],
  Aps: [[72370,81065],[81065,82273]],
  Aql: [[97649,97278],[97278,93747],[93747,97804],[97804,99473],[99473,100027],[97649,98036],[98036,99473]],
  Aqr: [[109074,106278],[106278,104459],[104459,102618],[102618,106278],[104459,107315],[107315,110395],[110395,111497],[111497,112961]],
  Ara: [[85727,83081],[83081,82363],[82363,85727],[82363,86092],[86092,87585]],
  Ari: [[9884,8903],[8903,10064],[10064,11795]],
  Aur: [[24608,28380],[28380,25985],[25985,23015],[23015,24608],[24608,28380],[23015,28380]],
  Boo: [[69673,71075],[71075,72105],[72105,67927],[67927,69673],[72105,74666],[72105,73555]],
  CMa: [[32349,33579],[33579,34444],[34444,33160],[33160,32349],[32349,30438],[30438,31592],[31592,33347],[33579,35904],[35904,35550]],
  CMi: [[37279,36188]],
  CVn: [[63257,61317]],
  Cap: [[100064,102485],[102485,104139],[104139,105515],[105515,107556],[107556,100064]],
  Car: [[30438,45556],[45556,50099],[50099,52419],[52419,41037],[41037,30438],[45556,41037]],
  Cas: [[3179,6686],[6686,4427],[4427,8886],[8886,11569]],
  Cen: [[68702,68933],[68933,71683],[71683,68702],[68702,71860],[71860,71352],[71352,68702],[68933,67464],[67464,68243]],
  Cep: [[105199,109492],[109492,112724],[112724,116727],[116727,105199]],
  Cet: [[8645,5364],[5364,3419],[3419,3179],[8645,12387],[12387,13954],[13954,14135]],
  Col: [[27628,28328],[28328,27989],[27989,28527]],
  CrA: [[90185,90496],[90496,92953]],
  CrB: [[76267,78159],[78159,78493],[78493,76267]],
  Crt: [[55705,53740],[53740,55705]],
  Cru: [[60718,61084],[62434,61932],[59747,62434]],
  Crv: [[59803,61359],[61359,61941],[61941,60742],[60742,59803]],
  Cyg: [[102098,100453],[100453,95947],[95947,94779],[94779,92420],[95947,102589],[102589,104732]],
  Del: [[101421,101769],[101769,101958],[101958,102532],[102532,101421]],
  Dor: [[21281,19893],[19893,26069]],
  Dra: [[85670,87585],[87585,94376],[94376,97433],[97433,85670],[85670,75458],[75458,68756],[68756,61281],[61281,56211]],
  Eri: [[17378,16611],[16611,15510],[15510,14146],[14146,12486],[12486,17874],[17874,13701],[13701,10602],[10602,9007],[9007,7588],[7588,5165]],
  For: [[14879,13147],[13147,10761]],
  Gem: [[37826,36850],[36850,34693],[34693,30343],[30343,29655],[29655,30343],[30343,34088],[36850,37740],[37740,36188],[37826,36188]],
  Gru: [[109268,112122],[112122,114421],[114421,113638],[113638,109268]],
  Her: [[84345,86974],[86974,84379],[84379,81693],[81693,80816],[80816,84345],[84345,85112],[85112,86974],[80816,79992],[79992,77760]],
  Hor: [[12484,10612]],
  Hya: [[43813,42313],[42313,39953],[39953,43234],[43234,46390],[46390,47431],[47431,49841],[49841,50583],[50583,53910],[53910,57380],[57380,59316]],
  Ind: [[101772,103227]],
  Leo: [[49669,54872],[54872,57632],[57632,54879],[54879,54872],[49669,46750],[46750,47908],[47908,49583],[49583,49669]],
  Lep: [[27072,25606],[25606,24305],[24305,25985],[25985,27072],[24305,23685]],
  Lib: [[76333,74785],[74785,72622],[72622,76333],[76333,75177]],
  Lup: [[75177,76297],[76297,74395],[74395,73273],[73273,75177],[73273,71860]],
  Lyn: [[45688,44700],[44700,43535],[43535,42291],[42291,41075],[41075,44700]],
  Lyr: [[91262,91971],[91971,92420],[92420,91262],[91971,93194]],
  Men: [[29271,21949]],
  Mic: [[105319,103738]],
  Mon: [[39953,37447],[37447,34769],[34769,30867],[30867,39953],[37447,38170]],
  Nor: [[80582,78612],[78612,79509]],
  Oct: [[107089,112405]],
  Oph: [[84970,79593],[79593,80883],[80883,84970],[84970,84012],[84012,86742],[86742,87933],[87933,88048],[88048,84970]],
  Ori: [[27989,26727],[26727,25930],[25930,26311],[26311,27989],[26311,27366],[27366,24436],[24436,25930],[27989,25336],[25336,26207],[22449,25336],[22449,26207]],
  Pav: [[86929,87157],[87157,92609],[92609,90098]],
  Peg: [[113963,112158],[112158,109427],[109427,113963],[112748,112158],[1067,677]],
  Per: [[14576,15863],[15863,17448],[17448,18532],[18532,14576],[14576,13268],[13268,15863]],
  Phe: [[2081,5165],[5165,6867],[6867,2081],[2081,3405]],
  Pic: [[27321,27530],[27530,32607]],
  PsA: [[113368,110893],[110893,107608]],
  Psc: [[9487,7097],[7097,4906],[4906,3786],[3786,9487],[9487,116771]],
  Pup: [[35264,36377],[36377,37229],[37229,38827],[38827,39429],[36377,31685]],
  Pyx: [[42828,42515],[42515,42948]],
  Ret: [[19780,18597],[18597,17440],[17440,19780]],
  Sco: [[80763,78401],[78401,78265],[78265,78820],[78820,80763],[80763,82396],[82396,83000],[83000,85563],[85563,86228],[86228,86670],[86670,87073],[87073,86927],[86927,87261],[87261,87585]],
  Sct: [[91117,90595],[90595,89642]],
  Ser: [[77070,75695],[75695,73714],[73714,77070],[77070,77233],[84880,85696],[85696,86263]],
  Sgr: [[98032,93506],[93506,90185],[90185,89642],[89642,88635],[88635,90185],[93506,96229],[96229,98032],[88635,89931],[89931,90496]],
  Tau: [[21421,23015],[23015,20889],[20889,17702],[17702,18724],[18724,20205],[20205,21421],[21421,20842]],
  TrA: [[77952,74946],[74946,80686],[80686,77952]],
  Tri: [[10670,8796],[8796,9884],[9884,10670]],
  UMa: [[54061,53910],[53910,58001],[58001,59774],[59774,62956],[62956,65378],[65378,67301],[59774,54061]],
  UMi: [[11767,85822],[85822,82080],[82080,79822],[79822,77055],[77055,72607],[72607,75097],[75097,82080]],
  Vel: [[39953,42570],[42570,44816],[44816,45941],[45941,44816]],
  Vir: [[65474,63608],[63608,61941],[61941,57380],[57380,60129],[60129,63608],[65474,69701],[69701,72220]],
  Vol: [[37504,34481],[34481,37504]],
  Vul: [[95771,98337]],
}

// ---------------------------------------------------------------------------
// Download helpers
// ---------------------------------------------------------------------------
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${url}`))
      res.pipe(file)
      file.on("finish", () => file.close(resolve))
    }).on("error", reject)
  })
}

async function decompress(gzPath, csvPath) {
  await pipeline(createReadStream(gzPath), createGunzip(), createWriteStream(csvPath))
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------
async function parseHYG(csvPath, magLimit) {
  const stars = []
  const rl = createInterface({ input: createReadStream(csvPath), crlfDelay: Infinity })

  let header = null
  for await (const line of rl) {
    const stripQ = (s) => s?.replace(/^"|"$/g, "").trim()
    if (!header) { header = line.split(",").map(stripQ); continue }
    const cols = line.split(",")
    const row = Object.fromEntries(header.map((k, i) => [k, stripQ(cols[i])]))

    const mag = parseFloat(row.mag)
    const hip = parseInt(row.hip, 10)
    const ra  = parseFloat(row.ra)
    const dec = parseFloat(row.dec)
    const con = row.con?.trim()

    if (!hip || isNaN(mag) || mag > magLimit || isNaN(ra) || isNaN(dec) || !con) continue

    stars.push({
      hip,
      ra,
      dec,
      mag: Math.round(mag * 100) / 100,
      name: row.proper?.trim() || undefined,
      con,
    })
  }

  return stars.sort((a, b) => a.mag - b.mag)
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------
function generateTS(stars, lines) {
  const starLines = stars.map((s) => {
    const name = s.name ? `, name: "${s.name}"` : ""
    return `  { hip: ${s.hip}, ra: ${s.ra}, dec: ${s.dec}, mag: ${s.mag}, con: "${s.con}"${name} },`
  })

  const conLines = Object.entries(lines)
    .map(([con, pairs]) => `  ${con}: [${pairs.map((p) => `[${p[0]},${p[1]}]`).join(",")}],`)
    .join("\n")

  return `// AUTO-GENERATED by scripts/generate-catalog.mjs — do not edit manually.
// Source: HYG Database v3.8 (CC BY-SA 2.5) — astronexus/HYG-Database
// Stars: mag ≤ ${MAG_LIMIT} with Hipparcos ID (${stars.length} total)

export interface CatalogStar {
  hip: number    // Hipparcos ID
  ra:  number    // right ascension (hours, J2000)
  dec: number    // declination (degrees, J2000)
  mag: number    // apparent visual magnitude
  con: string    // constellation abbreviation
  name?: string  // proper name if available
}

export const STARS: CatalogStar[] = [
${starLines.join("\n")}
]

// Constellation lines: pairs of Hipparcos IDs (IAU Western sky culture)
export const CONSTELLATION_LINES: Record<string, [number, number][]> = {
${conLines}
}
`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Downloading HYG v3.8...")
  await download(HYG_URL, TEMP_GZ)
  console.log("Decompressing...")
  await decompress(TEMP_GZ, TEMP_CSV)
  console.log(`Parsing stars (mag ≤ ${MAG_LIMIT})...`)
  const stars = await parseHYG(TEMP_CSV, MAG_LIMIT)
  console.log(`Found ${stars.length} stars. Generating TypeScript...`)
  const code = generateTS(stars, CONSTELLATION_LINES)
  writeFileSync(OUTPUT, code, "utf8")
  console.log(`Done → lib/star-catalog.ts (${stars.length} stars)`)
}

main().catch((err) => { console.error(err); process.exit(1) })
