"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
// ─── Types ─────────────────────────────────────────────────────────────────

interface Municipio {
  nome: string
  uf:   string
}

interface CityComboboxProps {
  value:    string
  onChange: (value: string) => void
  required?: boolean
  id?:      string
}

// ─── Constants ─────────────────────────────────────────────────────────────

const MIN_QUERY_LENGTH = 2
const MAX_SUGGESTIONS  = 8

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Remove acentos e converte para minúsculas para comparação insensível. */
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

/** Formata um município como "Nome, UF". */
const fmt = (m: Municipio) => `${m.nome}, ${m.uf}`

/**
 * Verifica se o valor digitado corresponde exatamente a um município da lista.
 * Útil para usuários que digitam "São Paulo, SP" manualmente sem usar o dropdown.
 */
function exactMatch(value: string, municipios: Municipio[]): boolean {
  const v = normalize(value.trim())
  return municipios.some(m => normalize(fmt(m)) === v)
}

/**
 * Filtra municípios pelo query digitado.
 * Prioriza resultados que começam com o termo sobre os que apenas contêm.
 */
function filterMunicipios(municipios: Municipio[], query: string): Municipio[] {
  if (query.length < MIN_QUERY_LENGTH) return []
  const q = normalize(query.replace(/,.*$/, "").trim())
  if (!q) return []

  const starts:   Municipio[] = []
  const contains: Municipio[] = []

  for (const m of municipios) {
    const n = normalize(m.nome)
    if (n.startsWith(q))    starts.push(m)
    else if (n.includes(q)) contains.push(m)
    if (starts.length + contains.length >= MAX_SUGGESTIONS * 3) break
  }

  return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
}

// ─── Component ─────────────────────────────────────────────────────────────

export function CityCombobox({ value, onChange, required, id }: CityComboboxProps) {
  const [open,             setOpen]             = useState(false)
  const [inputValue,       setInputValue]       = useState(value)
  const [municipios,       setMunicipios]       = useState<Municipio[] | null>(null)
  const [loading,          setLoading]          = useState(false)
  const [selectedFromList, setSelectedFromList] = useState(false)
  const [touched,          setTouched]          = useState(false)
  const [isFocused,        setIsFocused]        = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Lazy-load dos dados ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (municipios !== null) return
    setLoading(true)
    try {
      const res  = await fetch("/municipios-br.json")
      const data = await res.json() as Municipio[]
      setMunicipios(data)
    } finally {
      setLoading(false)
    }
  }, [municipios])

  // ── Sync com valor externo ────────────────────────────────────────────────
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // ── Sugestões filtradas ───────────────────────────────────────────────────
  const suggestions = useMemo(
    () => (municipios ? filterMunicipios(municipios, inputValue) : []),
    [municipios, inputValue],
  )

  // ── Validade ──────────────────────────────────────────────────────────────
  // Vazio → válido (o atributo `required` cuida de campos obrigatórios vazios).
  // Valor preenchido → válido se foi selecionado na lista OU bate exatamente
  // com algum município (digitação manual correta, ex: "São Paulo, SP").
  const isValid = useMemo(() => {
    if (!inputValue) return true
    if (selectedFromList) return true
    if (!municipios) return false
    return exactMatch(inputValue, municipios)
  }, [inputValue, selectedFromList, municipios])

  // Sincroniza a validação nativa do browser — bloqueia o submit do formulário
  // quando o campo tem valor inválido, sem depender de lógica no componente pai.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.setCustomValidity(
      !isValid && inputValue
        ? "Selecione uma cidade da lista de sugestões"
        : "",
    )
  }, [isValid, inputValue])

  // Erro visual: só aparece após o usuário sair do campo (touched + !isFocused)
  // para não atrapalhar enquanto ainda está digitando.
  const showError    = touched && !isFocused && !isValid && inputValue.length > 0
  const emptyError   = touched && !isFocused && required && !inputValue
  const errorMessage = emptyError
    ? "Por favor, informe uma cidade"
    : "Cidade não encontrada. Selecione uma sugestão da lista."

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (municipio: Municipio) => {
      const formatted = fmt(municipio)
      setInputValue(formatted)
      onChange(formatted)
      setSelectedFromList(true)
      setTouched(false)
      setOpen(false)
      inputRef.current?.blur()
    },
    [onChange],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setInputValue(v)
      onChange(v)
      setSelectedFromList(false)
      setOpen(v.length >= MIN_QUERY_LENGTH)
    },
    [onChange],
  )

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    loadData()
    if (inputValue.length >= MIN_QUERY_LENGTH) setOpen(true)
  }, [loadData, inputValue])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    setTouched(true)
    // Pequeno delay para o click no item do popover ser processado antes de fechar
    setTimeout(() => setOpen(false), 150)
  }, [])

  // Suprime o popup nativo de validação do browser (feio e em inglês)
  // e garante que nosso erro customizado seja exibido no lugar.
  const handleInvalid = useCallback((e: React.InvalidEvent<HTMLInputElement>) => {
    e.preventDefault()
    setTouched(true)
  }, [])

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="space-y-1">
          <div className="relative">
            <input
              ref={inputRef}
              id={id}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              required={required}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onInvalid={handleInvalid}
              placeholder="São Paulo, SP"
              aria-invalid={showError || emptyError}
              aria-expanded={open}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              className={cn(
                "flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors",
                "bg-secondary text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                "disabled:cursor-not-allowed disabled:opacity-50",
                (showError || emptyError)
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-border",
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
              }
            </span>
          </div>

          {(showError || emptyError) && (
            <p role="alert" className="text-xs text-destructive px-0.5">
              {errorMessage}
            </p>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 border-border/60"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
              Nenhuma cidade encontrada.
            </CommandEmpty>
            <CommandGroup>
              {suggestions.map((m) => (
                <CommandItem
                  key={`${m.nome}-${m.uf}`}
                  value={fmt(m)}
                  onSelect={() => handleSelect(m)}
                  className="cursor-pointer"
                >
                  <span className="flex-1">
                    {m.nome}
                    <span className="ml-1.5 text-xs text-muted-foreground">{m.uf}</span>
                  </span>
                  {inputValue === fmt(m) && (
                    <Check className="ml-2 h-4 w-4 text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
