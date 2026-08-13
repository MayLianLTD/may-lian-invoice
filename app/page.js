'use client';
import { useState, useEffect } from 'react';

const T = {
  en: {
    title: 'MAY LIAN LTD — Invoicing',
    customers: 'Customers', invoices: 'Invoices',
    addCustomer: 'Add customer', name: 'Full name', nickname: 'Nickname',
    email: 'Email', phone: 'Phone (optional)', save: 'Save', edit: 'Edit', cancel: 'Cancel',
    newInvoice: 'New invoice', selectCustomer: 'Select customer',
    description: 'Description', amount: 'Amount', beforeGst: 'Before GST',
    afterGst: 'After GST (amount includes GST)', paid: 'Paid', unpaid: 'Unpaid',
    create: 'Create invoice', viewPdf: 'View / print PDF', sendEmail: 'Send to customer',
    subtotal: 'Subtotal', gst: 'GST (15%)', total: 'Total',
    terms: 'Payment due within 10 business days.',
    search: 'Search by name or nickname...',
    sent: 'Sent', notSent: 'Not sent yet',
    confirmSend: 'Send this invoice to the customer now? Only do this once to avoid sending duplicates.',
    addDate: '+ Add date/task row', date: 'Date', task: 'Task / cleaning done',
    useTable: 'Build description from dates', freeText: 'Free text instead',
  },
  zh: {
    title: 'MAY LIAN LTD — 发票管理',
    customers: '客户', invoices: '发票',
    addCustomer: '添加客户', name: '姓名', nickname: '昵称',
    email: '电子邮箱', phone: '电话（可选）', save: '保存', edit: '编辑', cancel: '取消',
    newInvoice: '新建发票', selectCustomer: '选择客户',
    description: '描述', amount: '金额', beforeGst: '不含税',
    afterGst: '含税金额', paid: '已付款', unpaid: '未付款',
    create: '创建发票', viewPdf: '查看/打印PDF', sendEmail: '发送给客户',
    subtotal: '小计', gst: '消费税 (15%)', total: '总计',
    terms: '请在10个工作日内付款。',
    search: '按姓名或昵称搜索...',
    sent: '已发送', notSent: '尚未发送',
    confirmSend: '确定要发送这份发票给客户吗？请勿重复发送。',
    addDate: '+ 添加日期/任务', date: '日期', task: '任务/清洁内容',
    useTable: '用日期表生成描述', freeText: '改用自由文本',
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
  const [editingCustId, setEditingCustId] = useState(null);
  const [editCust, setEditCust] = useState({ name: '', nickname: '', email: '', phone: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [taxMode, setTaxMode] = useState('before');
  const [paid, setPaid] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const [useTableMode, setUseTableMode] = useState(false);
  const [dateRows, setDateRows] = useState([{ date: '', task: '' }]);

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

  function startEditCustomer(c) {
    setEditingCustId(c.id);
    setEditCust({ name: c.name || '', nickname: c.nickname || '', email: c.email || '', phone: c.phone || '' });
  }

  async function saveEditCustomer(id) {
    if (!editCust.name.trim()) return;
    setBusy(true);
    const res = await fetch('/api/customers', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editCust }),
    });
    setBusy(false);
    if (res.ok) {
      setEditingCustId(null);
      loadAll();
    }
  }

  function addDateRow() {
    setDateRows([...dateRows, { date: '', task: '' }]);
  }

  function updateDateRow(i, field, value) {
    const copy = [...dateRows];
    copy[i][field] = value;
    setDateRows(copy);
  }

  function removeDateRow(i) {
    setDateRows(dateRows.filter((_, idx) => idx !== i));
  }

  function buildDescriptionFromRows() {
    return dateRows
      .filter(r => r.date || r.task)
      .map(r => (r.date || '(no date)') + ' — ' + (r.task || '(no task)'))
      .join('\n');
  }

  async function createInvoice(e) {
    e.preventDefault();
    const finalDescription = useTableMode ? buildDescriptionFromRows() : description;

    const errs = {};
    if (!selectedCustomerId) errs.customer = 'Select a customer';
    if (!finalDescription.trim()) errs.description = 'Enter a description';
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a number greater than 0';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const res = await fetch('/api/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: selectedCustomerId, description: finalDescription, amount: amt, tax_mode: taxMode, paid }),
    });
    setBusy(false);
    if (res.ok) {
      setDescription(''); setAmount(''); setPaid(false);
      setDateRows([{ date: '', task: '' }]);
      loadAll();
      setNotice('Invoice created.');
      setTimeout(() => setNotice(''), 2500);
    } else {
      const d = await res.json();
      setErrors({ form: d.error });
    }
  }

  async function togglePaid(inv) {
    await fetch('/api/invoices/' + inv.id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: !inv.paid }),
    });
    loadAll();
  }

  async function sendEmail(inv) {
    if (inv.email_sent_at) {
      const reallyConfirm = window.confirm('This invoice was already sent before. Send it again anyway?');
      if (!reallyConfirm) return;
    } else {
      const confirmed = window.confirm(t.confirmSend);
      if (!confirmed) return;
    }
    setBusy(true);
    const res = await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: inv.id }),
    });
    setBusy(false);
    const d = await res.json();
    if (res.ok) { setNotice('Email sent!'); } else { setNotice('Error: ' + d.error); }
    setTimeout(() => setNotice(''), 3000);
    loadAll();
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
              {editingCustId === c.id ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <input placeholder={t.name} value={editCust.name} onChange={e => setEditCust({ ...editCust, name: e.target.value })} style={inputStyle} />
                  <input placeholder={t.nickname} value={editCust.nickname} onChange={e => setEditCust({ ...editCust, nickname: e.target.value })} style={inputStyle} />
                  <input placeholder={t.email} value={editCust.email} onChange={e => setEditCust({ ...editCust, email: e.target.value })} style={inputStyle} />
                  <input placeholder={t.phone} value={editCust.phone} onChange={e => setEditCust({ ...editCust, phone: e.target.value })} style={inputStyle} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEditCustomer(c.id)} disabled={busy} style={primaryBtnSmall}>{t.save}</button>
                    <button onClick={() => setEditingCustId(null)} style={secondaryBtn}>{t.cancel}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name} {c.nickname && <span style={{ color: '#888', fontWeight: 400 }}>({c.nickname})</span>}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{c.email} {c.phone && '· ' + c.phone}</div>
                  </div>
                  <button onClick={() => startEditCustomer(c)} style={secondaryBtn}>{t.edit}</button>
                </div>
              )}
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
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.nickname ? ' (' + c.nickname + ')' : ''}</option>)}
            </select>
            {errors.customer && <div style={errStyle}>{errors.customer}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: '#555' }}>{t.description}</label>
              <button type="button" onClick={() => setUseTableMode(!useTableMode)} style={{ ...secondaryBtn, fontSize: 12 }}>
                {useTableMode ? t.freeText : t.useTable}
              </button>
            </div>

            {useTableMode ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {dateRows.map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input type="date" value={row.date} onChange={e => updateDateRow(i, 'date', e.target.value)} style={{ ...inputStyle, flex: '0 0 150px' }} />
                    <input placeholder={t.task} value={row.task} onChange={e => updateDateRow(i, 'task', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    {dateRows.length > 1 && (
                      <button type="button" onClick={() => removeDateRow(i)} style={{ ...secondaryBtn, color: '#b02a2a' }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addDateRow} style={{ ...secondaryBtn, alignSelf: 'flex-start' }}>{t.addDate}</button>
              </div>
            ) : (
              <textarea placeholder={t.description} value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />
            )}
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
              <div style={{ fontSize: 12, marginTop: 4, color: inv.email_sent_at ? '#2a7a2a' : '#999' }}>
                {inv.email_sent_at ? ('✓ ' + t.sent + ' ' + new Date(inv.email_sent_at).toLocaleString()) : t.notSent}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <a href={'/api/invoices/pdf?id=' + inv.id} target="_blank" rel="noreferrer" style={secondaryBtnLink}>{t.viewPdf}</a>
                <button onClick={() => sendEmail(inv)} disabled={busy} style={primaryBtnSmall}>{t.sendEmail}</button>
                <button onClick={() => togglePaid(inv)} style={inv.paid ? paidBtn : unpaidBtn}>{inv.paid ? t.unpaid : t.paid}</button>
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
const paidBtn = { ...secondaryBtn, background: '#2a7a2a', color: '#fff', border: '1px solid #2a7a2a' };
const unpaidBtn = { ...secondaryBtn, background: '#b02a2a', color: '#fff', border: '1px solid #b02a2a' };
