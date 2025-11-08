import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: 'Helvetica'
  },
  h1: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  tableH: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8
  },
  cell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  headerRow: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    paddingVertical: 8
  },
  totalRow: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5'
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 12
  }
})

interface QuotePDFProps {
  quote: {
    quote_number: string
    title: string
    valid_until?: string
    kma_enabled?: boolean
    subtotal: number
    discount_amount: number
    tax_amount: number
    total_amount: number
    currency: string
    customer?: { name?: string }
  }
  items: Array<{
    name: string
    quantity: number
    unit: string
    unit_price: number
    net_price?: number
    discount?: number
  }>
}

export function QuotePDF({ quote, items }: QuotePDFProps) {
  const formatCurrency = (amount: number) => {
    return `${Number(amount).toFixed(2)} ${quote.currency || 'SEK'}`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('sv-SE')
    } catch {
      return dateStr
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Offert {quote.quote_number}</Text>
        
        <View style={{ marginVertical: 8 }}>
          <Text>Kund: {quote.customer?.name || '-'}</Text>
          <Text>Projekt: {quote.title}</Text>
          <Text>Giltig t.o.m: {formatDate(quote.valid_until)}</Text>
          {quote.kma_enabled && <Text>KMA: Aktiverad</Text>}
        </View>

        <Text style={styles.tableH}>Rader</Text>
        
        {/* Table Header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={styles.cell}>Beskrivning</Text>
          <Text style={styles.cell}>Kvantitet</Text>
          <Text style={styles.cell}>Enhet</Text>
          <Text style={styles.cell}>Pris/st</Text>
          <Text style={styles.cell}>Summa</Text>
        </View>

        {/* Table Rows */}
        {items.map((it, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.cell}>{it.name}</Text>
            <Text style={styles.cell}>{it.quantity}</Text>
            <Text style={styles.cell}>{it.unit}</Text>
            <Text style={styles.cell}>{formatCurrency(it.unit_price)}</Text>
            <Text style={styles.cell}>{formatCurrency(it.net_price || it.quantity * it.unit_price)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalRow}>
          <View style={styles.row}>
            <Text>Delsumma:</Text>
            <Text>{formatCurrency(quote.subtotal)}</Text>
          </View>
          {quote.discount_amount > 0 && (
            <View style={styles.row}>
              <Text>Rabatt:</Text>
              <Text>-{formatCurrency(quote.discount_amount)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text>Moms:</Text>
            <Text>{formatCurrency(quote.tax_amount)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Totalt:</Text>
            <Text style={styles.totalLabel}>{formatCurrency(quote.total_amount)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

