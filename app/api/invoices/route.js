import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

const BIZ = {
  name: 'MAY LIAN LTD',
  bankName: 'ANZ',
  bankNumber: '01-0221-0744468-00',
  gst: '131-897-510',
  mobile: '0226922155',
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 4, fontWeight: 700 },
  subheader: { fontSize: 10, color: '#555', marginBottom: 2 },
  section: { marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#555' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#ddd', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, fontSize: 13, fontWeight: 700 },
  footer: { marginTop: 30, fontSize: 9, color: '#777' },
});

function InvoiceDoc({ invoice }) {
  const c = invoice.customers;
  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.header }, BIZ.name),
      React.createElement(Text, { style: styles.subheader }, `GST number: ${BIZ.gst}`),
      React.createElement(Text, { style: styles.subheader }, `Mobile: ${BIZ.mobile}`),
      React.createElement(View, { style: styles.section },
        React.createElement(View, { style: styles.row },
          React.createElement(Text, {}, `Invoice #${String(invoice.number).padStart(5, '0')}`),
          React.createElement(Text, {}, `Date: ${invoice.invoice_date}`)
        ),
        React.createElement(Text, { style: { ...styles.label, fontSize: 12, marginTop: 4 } }, `Reference: #${String(invoice.number).padStart(5, '0')}`),
        React.createElement(Text, { style: { marginTop: 6 } }, `Bill to: ${c?.name || ''}`)
      ),
      React.createElement(View, { style: styles.divider }),
      React.createElement(Text, {}, invoice.description),
      React.createElement(View, { style: styles.divider }),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Subtotal'),
        React.createElement(Text, {}, `$${Number(invoice.subtotal).toFixed(2)}`)
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'GST (15%)'),
        React.createElement(Text, {}, `$${Number(invoice.gst).toFixed(2)}`)
      ),
      React.createElement(View, { style: styles.totalRow },
        React.createElement(Text, {}, 'Total'),
        React.createElement(Text, {}, `$${Number(invoice.total).toFixed(2)} NZD`)
      ),
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, 'Payment due within 10 business days.'),
        React.createElement(Text, {}, `Bank account name: ${BIZ.name}`),
        React.createElement(Text, {}, `Bank: ${BIZ.bankName} ${BIZ.bankNumber}`),
        React.createElement(Text, {}, 'Questions about this invoice? Email may20030823@gmail.com')
      )
    )
  );
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 });

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, customers(*)')
    .eq('id', id)
    .single();

  if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const buffer = await renderToBuffer(React.createElement(InvoiceDoc, { invoice }));

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${String(invoice.number).padStart(5, '0')}.pdf"`,
    },
  });
}
