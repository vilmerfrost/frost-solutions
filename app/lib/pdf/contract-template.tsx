import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#666', marginBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  metaLabel: { fontWeight: 'bold', width: 130 },
  metaValue: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingBottom: 4 },
  sectionBody: { fontSize: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', fontWeight: 'bold', paddingVertical: 6, paddingHorizontal: 4, marginTop: 16 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  totalsLabel: { width: 120, textAlign: 'right', fontWeight: 'bold', paddingRight: 8 },
  totalsValue: { width: 100, textAlign: 'right' },
  totalsFinal: { fontWeight: 'bold', fontSize: 12 },
  signatureBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 48 },
  signatureCol: { width: '45%' },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#333', marginTop: 40, marginBottom: 4 },
  signatureLabel: { fontSize: 9, color: '#666' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#999', textAlign: 'center' },
})

function fmt(n: number): string {
  return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d?: string | null): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('sv-SE').format(new Date(d))
}

interface ContractPDFProps {
  contract: {
    contract_number: string
    title: string
    description?: string | null
    contract_type: string
    counterparty_name?: string | null
    start_date?: string | null
    end_date?: string | null
    subtotal: number
    tax_amount: number
    total_amount: number
    sections: Array<{ title: string; content: string }>
    client?: { name: string } | null
    project?: { name: string } | null
  }
  items: Array<{
    description: string
    quantity: number
    unit: string
    unit_price: number
    line_total?: number
  }>
  tenantName: string
}

export function ContractPDF({ contract, items, tenantName }: ContractPDFProps) {
  const counterparty = contract.counterparty_name || contract.client?.name || '—'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{contract.title}</Text>
          <Text style={styles.subtitle}>{contract.contract_number}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Entreprenor:</Text>
            <Text style={styles.metaValue}>{tenantName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>
              {contract.contract_type === 'subcontractor' ? 'Underentreprenor:' : 'Bestallare:'}
            </Text>
            <Text style={styles.metaValue}>{counterparty}</Text>
          </View>
          {contract.project && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Projekt:</Text>
              <Text style={styles.metaValue}>{contract.project.name}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Startdatum:</Text>
            <Text style={styles.metaValue}>{fmtDate(contract.start_date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Slutdatum:</Text>
            <Text style={styles.metaValue}>{fmtDate(contract.end_date)}</Text>
          </View>
        </View>

        {contract.description && (
          <View>
            <Text style={styles.sectionTitle}>Arbetsbeskrivning</Text>
            <Text style={styles.sectionBody}>{contract.description}</Text>
          </View>
        )}

        {items.length > 0 && (
          <View>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesc}>Beskrivning</Text>
              <Text style={styles.colQty}>Antal</Text>
              <Text style={styles.colUnit}>Enhet</Text>
              <Text style={styles.colPrice}>A-pris</Text>
              <Text style={styles.colTotal}>Summa</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnit}>{item.unit}</Text>
                <Text style={styles.colPrice}>{fmt(item.unit_price)}</Text>
                <Text style={styles.colTotal}>{fmt(item.line_total ?? item.quantity * item.unit_price)}</Text>
              </View>
            ))}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Netto:</Text>
              <Text style={styles.totalsValue}>{fmt(contract.subtotal)} SEK</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Moms:</Text>
              <Text style={styles.totalsValue}>{fmt(contract.tax_amount)} SEK</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, styles.totalsFinal]}>Totalt:</Text>
              <Text style={[styles.totalsValue, styles.totalsFinal]}>{fmt(contract.total_amount)} SEK</Text>
            </View>
          </View>
        )}

        {contract.sections.map((sec, i) => (
          <View key={i}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.content}</Text>
          </View>
        ))}

        <View style={styles.signatureBlock}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{tenantName}</Text>
            <Text style={styles.signatureLabel}>Datum: _______________</Text>
          </View>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{counterparty}</Text>
            <Text style={styles.signatureLabel}>Datum: _______________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {contract.contract_number} | Genererad {fmtDate(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  )
}
