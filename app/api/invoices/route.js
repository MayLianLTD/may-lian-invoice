import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const GST_RATE = 0.15;

export async function GET() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(*)')
    .order('number', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const { customer_id, description, amount, tax_mode, paid, invoice_date } = body;

  if (!customer_id || !description || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
  }

  let subtotal, gst, total;
  if (tax_mode === 'after') {
    total = amt;
    subtotal = amt / (1 + GST_RATE);
    gst = total - subtotal;
  } else {
    subtotal = amt;
    gst = amt * GST_RATE;
    total = subtotal + gst;
  }

  // Get next invoice number
  const { data: last } = await supabase
    .from('invoices')
    .select('number')
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = last ? last.number + 1 : 1;

  const { data, error } = await supabase
    .from('invoices')
    .insert([{
      number: nextNumber,
      customer_id,
      description,
      amount: amt,
      tax_mode,
      subtotal: Math.round(subtotal * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
      paid: !!paid,
      invoice_date: invoice_date || new Date().toISOString().slice(0, 10),
    }])
    .select('*, customers(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
