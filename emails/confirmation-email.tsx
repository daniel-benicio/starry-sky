import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface ConfirmationEmailProps {
  name1: string
  name2: string
  date:  string
  city:  string
}

export function ConfirmationEmail({ name1, name2, date, city }: ConfirmationEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>✨ Seu mapa estelar de {date} em {city} está pronto, {name1}!</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={logo}>✦ Céu do Nosso Dia ✦</Text>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Text style={starDecor}>✦ &nbsp; ✦ &nbsp; ✦</Text>
            <Heading style={heading}>
              O céu guardou esse momento
            </Heading>
            <Text style={subheading}>
              Em {city}, na noite de <strong style={highlight}>{date}</strong>,
              as estrelas formaram um mapa único — só para {name1} e {name2}.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Body */}
          <Section style={content}>
            <Text style={paragraph}>
              Olá, {name1}! Seu pagamento foi confirmado com sucesso.
              Estamos gerando o pôster personalizado com o céu de {city} na noite de <strong style={highlight}>{date}</strong>.
            </Text>
            <Text style={paragraph}>
              Em instantes você receberá outro e-mail com o pôster de {name1} & {name2} pronto para salvar ou imprimir.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Details */}
          <Section style={detailsSection}>
            <Text style={detailsTitle}>Detalhes do seu mapa</Text>
            <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
              <tbody>
                <DetailRow label="Casal"  value={`${name1} & ${name2}`} />
                <DetailRow label="Data"   value={date} />
                <DetailRow label="Cidade" value={city} />
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este e-mail foi enviado porque você adquiriu um mapa estelar no{" "}
              <strong>Céu do Nosso Dia</strong>.
            </Text>
            <Text style={footerText}>
              Dúvidas? Responda a este e-mail e vamos te ajudar.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={detailLabel}>{label}</td>
      <td style={detailValue}>{value}</td>
    </tr>
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
  color:       "#f5f3ff",
  fontSize:    "28px",
  fontWeight:  700,
  lineHeight:  1.3,
  margin:      "0 0 16px",
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

const content: React.CSSProperties = {
  padding: "32px 40px 8px",
}

const paragraph: React.CSSProperties = {
  color:      "rgba(229,224,255,0.75)",
  fontSize:   "15px",
  lineHeight: 1.7,
  margin:     "0 0 16px",
}

const detailsSection: React.CSSProperties = {
  padding: "24px 40px",
}

const detailsTitle: React.CSSProperties = {
  color:         "rgba(167,139,250,0.55)",
  fontSize:      "10px",
  fontWeight:    600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  margin:        "0 0 12px",
}

const detailLabel: React.CSSProperties = {
  color:      "rgba(229,224,255,0.45)",
  fontSize:   "13px",
  padding:    "5px 0",
  width:      "80px",
}

const detailValue: React.CSSProperties = {
  color:      "rgba(229,224,255,0.90)",
  fontSize:   "13px",
  fontWeight: 500,
  padding:    "5px 0",
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
