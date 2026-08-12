'use client';
import { useState, useEffect } from 'react';

const T = {
  en: {
    title: 'MAY LIAN LTD — Invoicing',
    customers: 'Customers', invoices: 'Invoices',
    addCustomer: 'Add customer', name: 'Full name', nickname: 'Nickname',
    email: 'Email', phone: 'Phone (optional)', save: 'Save',
    newInvoice: 'New invoice', selectCustomer: 'Select customer',
    description: 'Description', amount: 'Amount', beforeGst: 'Before GST',
    afterGst: 'After GST (amount includes GST)', paid: 'Paid', unpaid: 'Unpaid',
    create: 'Create invoice', viewPdf: 'View / print PDF', sendEmail: 'Send to customer',
    subtotal: 'Subtotal', gst: 'GST (15%)', total: 'Total',
    terms: 'Payment due within 10 business days.',
    search: 'Search by name or nickname...',
  },
  zh: {
    title: 'MAY LIAN LTD — 发票管理',
    customers: '客户', invoices: '发票',
    addCustomer: '添加客户', name: '姓名', nickname: '昵称',
    email: '电子邮箱', phone: '电话（可选）', save: '保存',
    newInvoice: '新建发票', selectCustomer: '选择客户',
    description: '描述', amount: '金额', beforeGst: '不含税',
    afterGst: '含税金额', paid: '已付款', unpaid: '未付款',
    create: '创建发票', viewPdf: '查看/打印PDF', sendEmail: '发送给客户',
    subtotal: '小计', gst: '消费税 (15%)', total: '总计',
    terms: '请在10个工作日内付款。',
    search: '按姓名或昵称搜索...',
  },
};

export default function Home() {
  const [lang, setLang] = useState('en');
  const t = T[lang];
  const [tab, setTab] = useState('invoices');
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [newCust, setNewCust] = useState({ name: '', nickname: '', email: '', phone: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [taxMode, setTaxMode] = useState('before');
  const [paid, setPaid] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function loadAll() {
    const [c, i] = await Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/invoices').then(r => r.json()),
    ]);
    setCustomers(c);
    setInvoices(i);
  }

  useEffect(() => { loadAll(); }, []);

  async function addCustomer(e) {
    e.preventDefault();
    if (!newCust.name.trim()) return;
    setBusy(true);
    const res = await fetch('/api/customers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCust),
    });
    setBusy(false);
    if (res.ok) {
      setNewCust({ name: '', nickname: '', email: '', phone: '' });
      loadAll();
    }
  }

  async function createInvoice(e) {
    e.preventDefault();
    const errs = {};
    if (!selectedCustomerId) errs.customer = 'Select a customer';
    if (!description.trim()) errs.description = 'Enter a description';
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a number greater than 0';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const res = await fetch('/api/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: selectedCustomerId, description, amount: amt, tax_mode: taxMode, paid }),
    });
    setBusy(false);
    if (res.ok) {
      setDescription(''); setAmount(''); setPaid(false);
      loadAll();
      setNotice('Invoice created.');
      setTimeout(() => setNotice(''), 2500);
    } else {
      const d = await res.json();
      setErrors({ form: d.error });
    }
  }

  async function togglePaid(inv) {
    await fetch(`/api/invoices/${inv.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: !inv.paid }),
    });
    loadAll();
  }

  async function sendEmail(inv) {
    setBusy(true);
    const res = await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: inv.id }),
    });
    setBusy(false);
    const d = await res.json();
    if (res.ok) { setNotice('Email sent!'); } else { setNotice('Error: ' + d.error); }
    setTimeout(() => setNotice(''), 3000);
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.nickname || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{t.title}</h1>
        <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('invoices')} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: tab === 'invoices' ? '#111' : '#eee', color: tab === 'invoices' ? '#fff' : '#111' }}>{t.invoices}</button>
        <button onClick={() => setTab('customers')} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: tab === 'customers' ? '#111' : '#eee', color: tab === 'customers' ? '#fff' : '#111' }}>{t.customers}</button>
      </div>

      {notice && <div style={{ padding: 10, background: '#eef7ee', border: '1px solid #bfe3bf', borderRadius: 6, marginBottom: 16 }}>{notice}</div>}

      {tab === 'customers' && (
        <div>
          <form onSubmit={addCustomer} style={{ display: 'grid', gap: 8, marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <strong>{t.addCustomer}</strong>
            <input placeholder={t.name} value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} style={inputStyle} />
            <input placeholder={t.nickname} value={newCust.nickname} onChange={e => setNewCust({ ...newCust, nickname: e.target.value })} style={inputStyle} />
            <input placeholder={t.email} value={newCust.email} onChange={e => setNewCust({ ...newCust, email: e.target.value })} style={inputStyle} />
            <input placeholder={t.phone} value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} style={inputStyle} />
            <button disabled={busy} style={primaryBtn}>{t.save}</button>
          </form>

          <input placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />
          {filteredCustomers.map(c => (
            <div key={c.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{c.name} {c.nickname && <span style={{ color: '#888', fontWeight: 400 }}>({c.nickname})</span>}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{c.email} {c.phone && '· ' + c.phone}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'invoices' && (
        <div>
          <form onSubmit={createInvoice} style={{ display: 'grid', gap: 8, marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <strong>{t.newInvoice}</strong>
            <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} style={inputStyle}>
              <option value="">{t.selectCustomer}</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.nickname ? ` (${c.nickname})` : ''}</option>)}
            </select>
            {errors.customer && <div style={errStyle}>{errors.customer}</div>}

            <textarea placeholder={t.description} value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />
            {errors.description && <div style={errStyle}>{errors.description}</div>}

            <input placeholder={t.amount} value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
            {errors.amount && <div style={errStyle}>{errors.amount}</div>}

            <div style={{ display: 'flex', gap: 16 }}>
              <label><input type="radio" checked={taxMode === 'before'} onChange={() => setTaxMode('before')} /> {t.beforeGst}</label>
              <label><input type="radio" checked={taxMode === 'after'} onChange={() => setTaxMode('after')} /> {t.afterGst}</label>
            </div>
            <label><input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} /> {t.paid}</label>

            {errors.form && <div style={errStyle}>{errors.form}</div>}
            <button disabled={busy} style={primaryBtn}>{t.create}</button>
          </form>

          {invoices.map(inv => (
            <div key={inv.id} style={{ padding: 14, border: '1px solid #eee', borderRadius: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>#{String(inv.number).padStart(5, '0')} — {inv.customers?.name}</strong>
                <span style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, background: inv.paid ? '#e6f4e6' : '#fdecec', color: inv.paid ? '#2a7a2a' : '#b02a2a' }}>
                  {inv.paid ? t.paid : t.unpaid}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{inv.invoice_date} · ${Number(inv.total).toFixed(2)} NZD</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a href={`/api/invoices/pdf?id=${inv.id}`} target="_blank" rel="noreferrer" style={secondaryBtnLink}>{t.viewPdf}</a>
                <button onClick={() => sendEmail(inv)} disabled={busy} style={primaryBtnSmall}>{t.sendEmail}</button>
                <button onClick={() => togglePaid(inv)} style={secondaryBtn}>{inv.paid ? t.unpaid : t.paid}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 14 };
const primaryBtn = { padding: '10px 16px', borderRadius: 6, border: 'none', background: '#111', color: '#fff', fontSize: 14, cursor: 'pointer' };
const primaryBtnSmall = { ...primaryBtn, padding: '6px 12px', fontSize: 13 };
const secondaryBtn = { padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', fontSize: 13, cursor: 'pointer' };
const secondaryBtnLink = { ...secondaryBtn, textDecoration: 'none', color: '#111', display: 'inline-flex', alignItems: 'center' };
const errStyle = { color: '#b02a2a', fontSize: 12 };
