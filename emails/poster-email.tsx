import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface PosterEmailProps {
  name1:         string
  name2:         string
  formattedDate: string
  city:          string
}

export function PosterEmail({ name1, name2, formattedDate, city }: PosterEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>✨ O céu de {city} em {formattedDate} — {name1} & {name2}</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={logo}>✦ Céu do Nosso Dia ✦</Text>
          </Section>

          {/* Hero text */}
          <Section style={hero}>
            <Text style={starDecor}>✦ &nbsp; ✦ &nbsp; ✦</Text>
            <Heading style={heading}>
              O céu de {city}<br />em {formattedDate}
            </Heading>
            <Text style={subheading}>
              Seu mapa estelar personalizado de <strong style={highlight}>{name1} & {name2}</strong>{" "}
              está em anexo neste e-mail, pronto para guardar ou imprimir.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Poster preview placeholder */}
          <Section style={posterSection}>
            <Text style={posterCaption}>
              📎 O pôster em alta resolução está anexado como{" "}
              <strong style={highlight}>poster.png</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Message */}
          <Section style={content}>
            <Text style={quote}>
              "Que esse céu seja sempre o lembrete de que naquela noite,
              o universo inteiro estava do lado de vocês."
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Gerado com carinho pelo <strong>Céu do Nosso Dia</strong>.
            </Text>
            <Text style={footerText}>
              Dúvidas? Responda a este e-mail.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#09090f",
  fontFamily:      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin:          0,
  padding:         "40px 0",
}

const container: React.CSSProperties = {
  backgroundColor: "#0f0f1a",
  border:          "1px solid rgba(167,139,250,0.18)",
  borderRadius:    "16px",
  maxWidth:        "520px",
  margin:          "0 auto",
  overflow:        "hidden",
}

const header: React.CSSProperties = {
  background:  "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #1a1040 100%)",
  padding:     "32px 40px 24px",
  textAlign:   "center",
}

const logo: React.CSSProperties = {
  color:         "#c4b5fd",
  fontSize:      "13px",
  fontWeight:    600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  margin:        0,
}

const hero: React.CSSProperties = {
  padding:   "40px 40px 24px",
  textAlign: "center",
}

const starDecor: React.CSSProperties = {
  color:         "rgba(167,139,250,0.50)",
  fontSize:      "16px",
  letterSpacing: "0.3em",
  margin:        "0 0 16px",
}

const heading: React.CSSProperties = {
  color:      "#f5f3ff",
  fontSize:   "26px",
  fontWeight: 700,
  lineHeight: 1.3,
  margin:     "0 0 16px",
}

const subheading: React.CSSProperties = {
  color:      "rgba(196,181,253,0.80)",
  fontSize:   "15px",
  lineHeight: 1.7,
  margin:     0,
}

const highlight: React.CSSProperties = {
  color: "#a78bfa",
}

const divider: React.CSSProperties = {
  borderColor: "rgba(167,139,250,0.15)",
  margin:      "0 40px",
}

const posterSection: React.CSSProperties = {
  padding:   "24px 40px",
  textAlign: "center",
}

const posterCaption: React.CSSProperties = {
  color:         "rgba(196,181,253,0.70)",
  fontSize:      "14px",
  margin:        0,
  background:    "rgba(167,139,250,0.06)",
  border:        "1px solid rgba(167,139,250,0.15)",
  borderRadius:  "8px",
  padding:       "16px 20px",
}

const content: React.CSSProperties = {
  padding: "32px 40px",
}

const quote: React.CSSProperties = {
  color:         "rgba(196,181,253,0.55)",
  fontSize:      "14px",
  fontStyle:     "italic",
  lineHeight:    1.8,
  textAlign:     "center",
  margin:        0,
  letterSpacing: "0.01em",
}

const footer: React.CSSProperties = {
  padding: "24px 40px 32px",
}

const footerText: React.CSSProperties = {
  color:      "rgba(229,224,255,0.30)",
  fontSize:   "12px",
  lineHeight: 1.6,
  margin:     "0 0 8px",
  textAlign:  "center",
}
