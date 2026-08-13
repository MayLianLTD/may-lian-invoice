import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const { name, nickname, email, phone } = body;
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('customers')
    .insert([{ name, nickname, email, phone }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const body = await req.json();
  const { id, name, nickname, email, phone } = body;
  if (!id) return NextResponse.json({ error: 'Missing customer id' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('customers')
    .update({ name, nickname, email, phone })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
