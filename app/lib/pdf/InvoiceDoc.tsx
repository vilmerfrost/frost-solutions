// lib/pdf/InvoiceDoc.tsx
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
 page: {
  padding: 40,
  fontSize: 11,
  fontFamily: 'Helvetica',
  backgroundColor: '#ffffff',
 },
 header: {
  marginBottom: 30,
  paddingBottom: 20,
  borderBottom: '2 solid #1e40af',
 },
 companyName: {
  fontSize: 24,
  fontWeight: 900,
  color: '#1e40af',
  marginBottom: 8,
 },
 invoiceTitle: {
  fontSize: 32,
  fontWeight: 900,
  color: '#111827',
  marginBottom: 15,
  textAlign: 'right',
 },
 headerRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
 },
 headerInfo: {
  fontSize: 10,
  color: '#6b7280',
  marginTop: 4,
 },
 section: {
  marginTop: 25,
  marginBottom: 15,
 },
 sectionTitle: {
  fontSize: 10,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 8,
 },
 clientName: {
  fontSize: 14,
  fontWeight: 700,
  color: '#111827',
  marginBottom: 4,
 },
 clientInfo: {
  fontSize: 10,
  color: '#4b5563',
  marginTop: 2,
 },
 table: {
  marginTop: 30,
 },
 tableHeader: {
  flexDirection: 'row',
  backgroundColor: '#f3f4f6',
  paddingVertical: 10,
  paddingHorizontal: 8,
  borderBottom: '2 solid #111827',
 },
 tableHeaderCell: {
  flex: 1,
  fontSize: 10,
  fontWeight: 700,
  color: '#111827',
  textTransform: 'uppercase',
 },
 tableRow: {
  flexDirection: 'row',
  paddingVertical: 10,
  paddingHorizontal: 8,
  borderBottom: '1 solid #e5e7eb',
 },
 tableCell: {
  flex: 1,
  fontSize: 10,
  color: '#374151',
 },
 tableCellRight: {
  flex: 1,
  fontSize: 10,
  color: '#374151',
  textAlign: 'right',
 },
 totals: {
  marginTop: 30,
  alignItems: 'flex-end',
 },
 totalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: 250,
  marginBottom: 8,
  fontSize: 11,
  color: '#374151',
 },
 totalLabel: {
  fontWeight: 600,
 },
 totalValue: {
  fontWeight: 700,
 },
 rotRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: 250,
  marginBottom: 8,
  fontSize: 11,
  color: '#065f46',
 },
 finalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: 250,
  marginTop: 10,
  paddingTop: 15,
  borderTop: '3 solid #111827',
  fontSize: 16,
  fontWeight: 900,
  color: '#111827',
 },
 footer: {
  position: 'absolute',
  bottom: 30,
  left: 40,
  right: 40,
  fontSize: 9,
  color: '#9ca3af',
  textAlign: 'center',
  borderTop: '1 solid #e5e7eb',
  paddingTop: 15,
 },
})

type Line = {
 description: string
 quantity: number
 unit: string
 rate_sek: number
 amount_sek: number
}

export default function InvoiceDoc({
 invoice,
 tenant,
 client,
 lines,
}: {
 invoice: { number: string | number; issue_date?: string; due_date?: string }
 tenant: { name: string; org_number?: string; address?: string }
 client: { name: string; address?: string; email?: string; org_number?: string }
 lines: Line[]
}) {
 const total = (lines || []).reduce((s, l) => s + (l.amount_sek || 0), 0)
 const rot = total * 0.3
 const toPay = total - rot

 return (
  <Document>
   <Page size="A4" style={styles.page}>
    {/* Header */}
    <View style={styles.header}>
     <View style={styles.headerRow}>
      <View>
       <Text style={styles.companyName}>FROST BYGG</Text>
       <Text style={styles.headerInfo}>Org.nr: {tenant.org_number || '556677-8899'}</Text>
       {tenant.address && <Text style={styles.headerInfo}>{tenant.address}</Text>}
       <Text style={styles.headerInfo}>info@frostbygg.se</Text>
      </View>
      <View>
       <Text style={styles.invoiceTitle}>FAKTURA</Text>
       <Text style={styles.headerInfo}>Fakturanr: {String(invoice.number ?? '')}</Text>
       <Text style={styles.headerInfo}>Utfärdad: {invoice.issue_date ?? new Date().toLocaleDateString('sv-SE')}</Text>
       <Text style={styles.headerInfo}>Förfallodatum: {invoice.due_date ?? ''}</Text>
      </View>
     </View>
    </View>

    {/* Client */}
    <View style={styles.section}>
     <Text style={styles.sectionTitle}>Faktura till</Text>
     <Text style={styles.clientName}>{client.name}</Text>
     {client.org_number && <Text style={styles.clientInfo}>Org.nr: {client.org_number}</Text>}
     {client.address && <Text style={styles.clientInfo}>{client.address}</Text>}
     {client.email && <Text style={styles.clientInfo}>{client.email}</Text>}
    </View>

    {/* Table */}
    <View style={styles.table}>
     <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Beskrivning</Text>
      <Text style={styles.tableHeaderCell}>Antal</Text>
      <Text style={styles.tableHeaderCell}>Enhet</Text>
      <Text style={styles.tableHeaderCell}>Á-pris</Text>
      <Text style={styles.tableHeaderCell}>Summa</Text>
     </View>

     {(lines || []).length > 0 ? (
      lines.map((l, i) => (
       <View key={i} style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 3 }]}>{l.description}</Text>
        <Text style={styles.tableCellRight}>{Number(l.quantity).toFixed(2)}</Text>
        <Text style={styles.tableCellRight}>{l.unit}</Text>
        <Text style={styles.tableCellRight}>{Number(l.rate_sek).toFixed(2)} kr</Text>
        <Text style={[styles.tableCellRight, { fontWeight: 700 }]}>{Number(l.amount_sek).toFixed(2)} kr</Text>
       </View>
      ))
     ) : (
      <View style={styles.tableRow}>
       <Text style={[styles.tableCell, { flex: 5, fontStyle: 'italic', color: '#9ca3af' }]}>
        Inga rader
       </Text>
      </View>
     )}
    </View>

    {/* Totals */}
    <View style={styles.totals}>
     <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>Summa</Text>
      <Text style={styles.totalValue}>{total.toFixed(2)} kr</Text>
     </View>
     <View style={styles.rotRow}>
      <Text style={styles.totalLabel}>Preliminärt ROT-avdrag (30%)</Text>
      <Text style={styles.totalValue}>-{rot.toFixed(2)} kr</Text>
     </View>
     <View style={styles.finalRow}>
      <Text>ATT BETALA</Text>
      <Text>{toPay.toFixed(2)} kr</Text>
     </View>
    </View>

    {/* Footer */}
    <View style={styles.footer}>
     <Text>Frost Bygg | Godkänd för F-skatt | Momsreg.nr: SE556677889901</Text>
     <Text style={{ marginTop: 5 }}>Betalningsvillkor: 30 dagar netto | Bankgiro: 123-4567</Text>
    </View>
   </Page>
  </Document>
 )
}
