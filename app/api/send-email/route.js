import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

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
          React.createElement(Text, {}, invoice.invoice_date)
        ),
        React.createElement(Text, { style: styles.label }, `Bill to: ${c?.name || ''}`)
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
        React.createElement(Text, {}, `Bank: ${BIZ.bankName} ${BIZ.bankNumber}`)
      )
    )
  );
}

export async function POST(req) {
  const { invoice_id } = await req.json();
  if (!invoice_id) return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 });

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, customers(*)')
    .eq('id', invoice_id)
    .single();

  if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (!invoice.customers?.email) return NextResponse.json({ error: 'Customer has no email on file' }, { status: 400 });

  const pdfBuffer = await renderToBuffer(React.createElement(InvoiceDoc, { invoice }));
  const numberPadded = String(invoice.number).padStart(5, '0');

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL, // e.g. 'MAY LIAN LTD <invoices@yourdomain.com>'
      to: invoice.customers.email,
      subject: `Invoice #${numberPadded} — ${BIZ.name}`,
      text: `Hi ${invoice.customers.name},\n\nPlease find attached invoice #${numberPadded} dated ${invoice.invoice_date} for $${Number(invoice.total).toFixed(2)} NZD.\n\nPayment due within 10 business days.\nBank: ${BIZ.bankName} ${BIZ.bankNumber}\n\nThank you,\n${BIZ.name}`,
      attachments: [
        {
          filename: `invoice-${numberPadded}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
