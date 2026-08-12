import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function PATCH(req, context) {
  const { id } = await context.params;
  const body = await req.json();

  const { data, error } = await supabase
    .from('invoices')
    .update(body)
    .eq('id', id)
    .select('*, customers(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req, context) {
  const { id } = await context.params;
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
