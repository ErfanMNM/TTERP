import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package, Warehouse, Activity, Send, ExternalLink,
  FileText, Share2, Paperclip, UserCheck, Plus, Trash2, AlertCircle, Pencil, Check, X, RefreshCw,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import RichEditor, { RichEditorHandle } from '../../components/RichEditor';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { getDoc, stockBalanceApi, commentApi, reportview, searchLink } from '../../services/api';
import { formatDate, formatCurrency, formatNumber, cn } from '../../lib/utils';

type Tab = 'general' | 'stock' | 'activity' | 'assign' | 'share';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'general', label: 'Tổng quan', icon: <FileText size={15} /> },
  { key: 'stock', label: 'Tồn kho', icon: <Warehouse size={15} /> },
  { key: 'activity', label: 'Hoạt động', icon: <Activity size={15} /> },
  { key: 'assign', label: 'Phân công', icon: <UserCheck size={15} /> },
  { key: 'share', label: 'Chia sẻ', icon: <Share2 size={15} /> },
];

export default function ItemDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const ERP_HOST = 'https://erp.mte.vn';

  const [tab, setTab] = useState<Tab>('general');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [docinfo, setDocinfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Sub-data (lazy loaded per tab)
  const [stockRows, setStockRows] = useState<Array<{ warehouse: string; actual_qty: number; projected_qty: number }>>([]);
  const [shares, setShares] = useState<Array<Record<string, unknown>>>([]);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Assign state
  const [assignTo, setAssignTo] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignPriority, setAssignPriority] = useState('Medium');
  const [assignDate, setAssignDate] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuggestions, setAssignSuggestions] = useState<Array<{ value: string; description: string; label: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [assignToFocused, setAssignToFocused] = useState(false);
  const assignInputRef = useRef<HTMLInputElement>(null);
  const descEditorRef = useRef<RichEditorHandle>(null);

  // Description edit state
  const [editingDesc, setEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);

  // ─── Initial load: getDoc gives us everything ─────────────────────────────────
  useEffect(() => {
    if (!name || name === 'new') {
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoc<Record<string, unknown>>('Item', name)
      .then(res => {
        setData(res.docs[0] || null);
        setDocinfo(res.docinfo as unknown as Record<string, unknown>);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [name]);

  // ─── Lazy load tab data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!data) return;

    if (tab === 'stock' && stockRows.length === 0) {
      setTabLoading(true);
      stockBalanceApi.list({ item_code: name!, limit: 100 })
        .then(res => setStockRows(Array.isArray(res.message) ? res.message as any : []))
        .catch(() => setStockRows([]))
        .finally(() => setTabLoading(false));
    }

    if (tab === 'share' && shares.length === 0) {
      setTabLoading(true);
      // DocShare via reportview
      reportview<{ message: { keys: string[]; values: unknown[][] } }>('frappe.desk.reportview.get', {
        doctype: 'DocShare',
        fields: JSON.stringify([
          '`tabDocShare`.`name`',
          '`tabDocShare`.`user`',
          '`tabDocShare`.`read`',
          '`tabDocShare`.`write`',
          '`tabDocShare`.`share`',
          '`tabDocShare`.`everyone`',
          '`tabDocShare`.`creation`',
        ]),
        filters: JSON.stringify([['DocShare', 'share_name', '=', name]]),
        order_by: '`tabDocShare`.`creation` desc',
        start: 0,
        page_length: 50,
        view: 'List',
        group_by: '',
        with_comment_count: false,
      }).then(res => {
        const raw = (res as any).message;
        if (raw?.keys && raw?.values) {
          setShares(raw.values.map((row: unknown[]) => {
            const obj: Record<string, unknown> = {};
            raw.keys.forEach((k: string, i: number) => { obj[k] = row[i]; });
            return obj;
          }));
        }
      }).catch(() => setShares([]))
        .finally(() => setTabLoading(false));
    }
  }, [tab, data]);

  const refreshComments = async () => {
    if (!name) return;
    const res = await getDoc<Record<string, unknown>>('Item', name);
    setDocinfo(res.docinfo as unknown as Record<string, unknown>);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !name) return;
    setSubmitting(true);
    try {
      await commentApi.create({
        comment_type: 'Comment',
        content: newComment.trim(),
        reference_doctype: 'Item',
        reference_name: name,
      });
      setNewComment('');
      await refreshComments();
    } catch { /* silent */ } finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (id: string) => {
    try { await commentApi.delete(id); await refreshComments(); } catch { /* silent */ }
  };

  // Save item description via savedocs
  const handleSaveDesc = async () => {
    if (!data) return;
    setSavingDesc(true);
    try {
      const doc = {
        ...data,
        description: descText,
        __unsaved: 1,
      };
      const body = new URLSearchParams({ doc: JSON.stringify(doc), action: 'Save' });
      const res = await fetch(`/api/method/frappe.desk.form.save.savedocs`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body,
      });
      const json = await res.json();
      if (!json.exception && json.docs?.[0]) {
        setData(json.docs[0]);
        if (json.docinfo) setDocinfo(json.docinfo as unknown as Record<string, unknown>);
      }
      setEditingDesc(false);
    } catch { /* silent */ } finally { setSavingDesc(false); }
  };

  const handleAssign = async () => {
    if (!assignTo.trim() || !itemCode) return;
    setAssignLoading(true);
    try {
      const body = new URLSearchParams({
        assign_to_me: '0',
        assign_to: JSON.stringify([assignTo.trim()]),
        date: assignDate,
        priority: assignPriority,
        description: assignDesc.trim() || '<div class="ql-editor read-mode"><p></p></div>',
        doctype: 'Item',
        name: itemCode,
        bulk_assign: 'false',
        re_assign: 'false',
      });
      await fetch(`/api/method/frappe.desk.form.assign_to.add`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body,
      });
      setAssignTo('');
      setAssignDesc('');
      setAssignPriority('Medium');
      setAssignDate('');
      const res = await getDoc<Record<string, unknown>>('Item', itemCode);
      setData(res.docs[0]);
      setDocinfo(res.docinfo as unknown as Record<string, unknown>);
    } catch { /* silent */ } finally { setAssignLoading(false); }
  };

  const handleRemoveAssign = async (assignToUser: string) => {
    if (!itemCode || !assignToUser) return;
    try {
      await fetch(`/api/method/frappe.desk.form.assign_to.remove`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Frappe-Doctype': 'Item',
        },
        body: new URLSearchParams({ doctype: 'Item', name: itemCode, assign_to: assignToUser }),
      });
      const res = await getDoc<Record<string, unknown>>('Item', itemCode);
      setData(res.docs[0]);
      setDocinfo(res.docinfo as unknown as Record<string, unknown>);
    } catch { /* silent */ }
  };

  const stripHtml = (html: string): string => {
    return html
      .replace(/<div class="ql-editor[^"]*">/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/<br\s*\/?>/gi, '\n')
      .trim();
  };

  // ─── Build activity timeline from docinfo ─────────────────────────────────────
  const comments: Array<{ name: string; content: string; owner: string; creation: string; comment_type: string }> =
    (docinfo?.comments as any) ?? [];
  const versions: Array<{ name: string; owner: string; creation: string; data: string }> =
    (docinfo?.versions as any) ?? [];
  const assignments: Array<{ name: string; owner: string; description: string }> =
    (docinfo?.assignments as any) ?? [];
  const assignmentLogs: Array<{ name: string; content: string; owner: string; creation: string; comment_type: string }> =
    (docinfo?.assignment_logs as any) ?? [];
  const attachmentLogs: Array<{ name: string; content: string; owner: string; creation: string; comment_type: string }> =
    (docinfo?.attachment_logs as any) ?? [];
  const fileAttachments: Array<{ name: string; file_name: string; file_url: string }> =
    (docinfo?.attachments as any) ?? [];

  const allActivities = [
    ...assignmentLogs.map(l => {
      const isAssigned = l.comment_type === 'Assigned';
      return {
        type: 'assignment' as const,
        label: isAssigned ? stripHtml(l.content).replace(/ assigned .+?: /, ' giao việc') : stripHtml(l.content),
        sub: formatDate(l.creation),
        owner: l.owner,
        time: l.creation,
        attachment: null,
        content: isAssigned ? stripHtml(l.content) : '',
      };
    }),
    ...attachmentLogs.map(a => ({
      type: 'attachment' as const,
      label: 'đính kèm tệp',
      sub: formatDate(a.creation),
      owner: a.owner,
      time: a.creation,
      attachment: a.content.match(/href="([^"]+)"/)?.[1] || null,
      content: '',
    })),
    ...comments.map(c => ({
      type: 'comment' as const,
      label: c.owner,
      sub: formatDate(c.creation),
      owner: c.owner,
      time: c.creation,
      attachment: null,
      content: stripHtml(c.content),
    })),
    ...versions.map(v => {
      let label = `${v.owner} cập nhật`;
      try {
        const d = JSON.parse(v.data);
        if (d.changed) label = `${d.changed_by} thay đổi "${d.changed[0]}"`;
        else if (d.created) label = `${d.created_by} tạo document`;
        else if (d.updater_reference?.label) label = d.updater_reference.label;
      } catch { /* ignore */ }
      return { type: 'version' as const, label, sub: formatDate(v.creation), owner: v.owner, time: v.creation, attachment: null, content: '' };
    }),
  ].sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

  const initials = (s: string) =>
    (s || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const avatarColor = (s: string) => {
    const colors = ['bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700'];
    return colors[(s || '').charCodeAt(0) % colors.length];
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = {
      Low: 'bg-gray-100 text-gray-600',
      Medium: 'bg-yellow-100 text-yellow-700',
      High: 'bg-orange-100 text-orange-700',
      Urgent: 'bg-red-100 text-red-700',
    };
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', map[p] || 'bg-gray-100 text-gray-600')}>
        {p}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Chi tiết vật tư" backTo="/stock/items" />
        <PageLoader rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto page-enter">
        <PageHeader title="Chi tiết vật tư" backTo="/stock/items" />
        <div className="card card-body text-center py-12 text-gray-400">
          <Package size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Không tìm thấy vật tư</p>
          <button onClick={() => navigate('/stock/items')} className="btn btn-secondary mt-4">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const d = (key: string) => data[key] as string | number | undefined;
  const itemName = (d('item_name') || d('name')) as string;
  const itemCode = d('name') as string;

  const openAssignments = assignments.filter(a => {
    // Check if there's an open ToDo for this assignment owner
    return true; // Show all assignments
  });

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title={itemName}
        subtitle={`Mã: ${itemCode}`}
        backTo="/stock/items"
        badge={<StatusBadge status={Number(d('disabled')) === 1 ? 'Inactive' : 'Active'} />}
        actions={
          <a
            href={`${ERP_HOST}/app/item/${encodeURIComponent(itemCode)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Mở trên ERPNext"
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <ExternalLink size={16} />
            <span className="hidden sm:inline">ERP</span>
          </a>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t.icon}
            {t.label}
            {t.key === 'assign' && openAssignments.length > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {openAssignments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB: Tổng quan ─── */}
      {tab === 'general' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              ['Mã SKU', d('item_code') || '—'],
              ['Nhóm', d('item_group') || '—'],
              ['ĐVT', d('stock_uom') || '—'],
              ['Thương hiệu', d('brand') || '—'],
            ].map(([label, value]) => (
              <div key={label as string} className="card card-body py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label as string}</p>
                <p className="text-sm font-semibold text-gray-800">{value as string}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><h2 className="text-base font-semibold text-gray-800">Thông tin chi tiết</h2></div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ['Mã vật tư', itemCode],
                  ['Mã SKU', d('item_code') || '—'],
                  ['Tên vật tư', d('item_name') || '—'],
                  ['Nhóm vật tư', d('item_group') || '—'],
                  ['Đơn vị tính', d('stock_uom') || '—'],
                  ['Thương hiệu', d('brand') || '—'],
                  ['Giá tiêu chuẩn', d('standard_rate') ? formatCurrency(d('standard_rate') as number) : '—'],
                  ['Giá định giá', d('valuation_rate') ? formatCurrency(d('valuation_rate') as number) : '—'],
                  ['Ngày tạo', d('creation') ? formatDate(d('creation') as string) : '—'],
                  ['Ngày sửa', d('modified') ? formatDate(d('modified') as string) : '—'],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label as string}</span>
                    <span className="text-sm text-gray-800 font-medium">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card mt-4">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Mô tả</h2>
              {!editingDesc && (
                <button
                  onClick={() => {
                    const raw = String(data?.description || '');
                    // Strip ERPNext wrapper: <div class="ql-editor ...">...</div> → just inner HTML
                    const inner = raw.replace(/<div class="ql-editor[^"]*">/, '').replace(/<\/div>$/, '').trim();
                    setDescText(inner);
                    setEditingDesc(true);
                  }}
                  className="btn btn-secondary px-2.5 py-1 text-xs flex items-center gap-1"
                >
                  <Pencil size={12} />
                  Sửa
                </button>
              )}
            </div>
            <div className="card-body">
              {editingDesc ? (
                <div className="space-y-3">
                  <RichEditor
                    ref={descEditorRef}
                    value={descText ? `<p>${descText}</p>` : ''}
                    onChange={html => setDescText(html)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDesc}
                      disabled={savingDesc}
                      className="btn btn-primary px-3 py-1.5 text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {savingDesc ? <span className="animate-spin"><RefreshCw size={13} /></span> : <Check size={13} />}
                      {savingDesc ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button
                      onClick={() => { setEditingDesc(false); setDescText(''); }}
                      className="btn btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
                    >
                      <X size={13} />
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {data?.description ? stripHtml(String(data.description)) : <span className="text-gray-400 italic">Chưa có mô tả</span>}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── TAB: Tồn kho ─── */}
      {tab === 'stock' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Warehouse size={16} />
              Tồn kho theo kho
            </h2>
          </div>
          <div className="card-body p-0">
            {tabLoading ? (
              <div className="p-8 text-center text-gray-400">Đang tải...</div>
            ) : stockRows.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">Không có dữ liệu tồn kho</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Kho</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-right">Tồn thực</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-right">Dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRows.map((row, i) => (
                    <tr key={i} className={cn('border-b border-gray-100', i % 2 === 1 && 'bg-gray-50/50')}>
                      <td className="px-5 py-2.5 text-gray-800">{row.warehouse}</td>
                      <td className={cn('px-5 py-2.5 text-right font-medium', row.actual_qty < 0 && 'text-red-600')}>
                        {formatNumber(row.actual_qty, 2)}
                      </td>
                      <td className={cn('px-5 py-2.5 text-right font-medium', row.projected_qty < 0 && 'text-red-600')}>
                        {formatNumber(row.projected_qty, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Hoạt động ─── */}
      {tab === 'activity' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} />
              Hoạt động
            </h2>
            <span className="text-xs text-gray-400">{allActivities.length}</span>
          </div>
          <div className="card-body">
            {/* File attachments */}
            {fileAttachments.length > 0 && (
              <div className="mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Paperclip size={12} />
                  Tệp đính kèm ({fileAttachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {fileAttachments.map(f => (
                    <a
                      key={f.name}
                      href={`${ERP_HOST}${f.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Paperclip size={12} />
                      <span className="truncate max-w-48">{f.file_name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comment input */}
            <div className="flex gap-3 items-start mb-6">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', avatarColor('User'))}>
                {initials('User')}
              </div>
              <div className="flex-1 flex gap-2">
                <textarea
                  ref={commentRef}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
                  }}
                  placeholder="Viết bình luận..."
                  rows={2}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
                <button onClick={handleAddComment} disabled={!newComment.trim() || submitting}
                  className="btn btn-primary self-end px-3 py-2 disabled:opacity-50">
                  <Send size={14} />
                </button>
              </div>
            </div>

            {/* Timeline */}
            {allActivities.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">Chưa có hoạt động nào</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3.5 top-3 bottom-2 w-px bg-gray-200" />
                <div className="space-y-4">
                  {allActivities.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 pl-1">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10', avatarColor(item.owner))}>
                        {initials(item.owner)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{item.label}</p>
                          <span className="text-xs text-gray-400">{item.sub}</span>
                        </div>
                        {item.type === 'attachment' && item.attachment && (
                          <a href={`${ERP_HOST}${item.attachment}`} target="_blank" rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-gray-100 transition-colors">
                            <Paperclip size={13} />
                            <span className="truncate max-w-xs">đính kèm</span>
                          </a>
                        )}
                        {item.content && (
                          <p className="mt-1 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg whitespace-pre-wrap">{item.content}</p>
                        )}
                        {item.type === 'comment' && (
                          <div className="flex items-center gap-1 mt-1">
                            <button onClick={() => { const c = comments.find(cm => cm.creation === item.time); if (c) handleDeleteComment(c.name); }}
                              className="text-xs text-gray-400 hover:text-red-600 transition-colors">Xóa</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Phân công ─── */}
      {tab === 'assign' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <UserCheck size={16} />
              Phân công
            </h2>
          </div>
          <div className="card-body">
            {/* Assign form */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Plus size={14} />
                Thêm phân công mới
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="text-xs text-gray-500 mb-1 block">Người được giao</label>
                  <input
                    ref={assignInputRef}
                    value={assignTo}
                    onChange={async e => {
                      setAssignTo(e.target.value);
                      const txt = e.target.value;
                      if (txt.length < 1) { setAssignSuggestions([]); setShowSuggestions(false); return; }
                      try {
                        const res = await searchLink('User', txt, { user_type: 'System User', enabled: '1' });
                        setAssignSuggestions(res);
                        setShowSuggestions(true);
                      } catch { setAssignSuggestions([]); }
                    }}
                    onFocus={async () => {
                      if (assignSuggestions.length === 0 && assignToFocused) {
                        try {
                          const res = await searchLink('User', '', { user_type: 'System User', enabled: '1' });
                          setAssignSuggestions(res);
                        } catch { /* silent */ }
                      }
                      setShowSuggestions(true);
                      setAssignToFocused(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Chọn hoặc gõ tìm người dùng..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  />
                  {showSuggestions && assignSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-56 overflow-y-auto">
                      {assignSuggestions.map(u => (
                        <button
                          key={u.value}
                          onMouseDown={() => { setAssignTo(u.value); setShowSuggestions(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(u.description || u.value)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.description}</p>
                            <p className="text-xs text-gray-400 truncate">{u.value}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ngày hết hạn</label>
                  <input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Độ ưu tiên</label>
                  <select value={assignPriority} onChange={e => setAssignPriority(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                    <option value="Low">Thấp</option>
                    <option value="Medium">Trung bình</option>
                    <option value="High">Cao</option>
                    <option value="Urgent">Khẩn cấp</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Mô tả</label>
                  <textarea value={assignDesc} onChange={e => setAssignDesc(e.target.value)}
                    placeholder="Nội dung công việc..." rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none" />
                </div>
              </div>
              <button onClick={handleAssign} disabled={!assignTo.trim() || assignLoading}
                className="btn btn-primary mt-3 flex items-center gap-1.5 disabled:opacity-50">
                <Plus size={14} />
                Giao việc
              </button>
            </div>

            {/* Assign list */}
            {assignments.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">Chưa có phân công nào</p>
            ) : (
              <div className="space-y-3">
                {assignments.map(a => {
                  // Parse description HTML
                  const descText = stripHtml(a.description || '');
                  return (
                    <div key={a.name} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', avatarColor(a.owner))}>
                        {initials(a.owner)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{a.owner}</span>
                        </div>
                        {descText && (
                          <p className="text-sm text-gray-600 mt-1">{descText}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">· {formatDate(a.name)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssign(a.owner)}
                        title="Xóa phân công"
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Chia sẻ ─── */}
      {tab === 'share' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Share2 size={16} />
              Chia sẻ tài liệu
            </h2>
            <a href={`${ERP_HOST}/app/item/${encodeURIComponent(itemCode)}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline">
              Chia sẻ trên ERPNext
            </a>
          </div>
          <div className="card-body p-0">
            {tabLoading ? (
              <div className="p-8 text-center text-gray-400">Đang tải...</div>
            ) : shares.length === 0 ? (
              <div className="text-center py-12">
                <Share2 size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Chưa có chia sẻ nào</p>
                <p className="text-xs text-gray-400 mt-1">Tính năng chia sẻ cần thực hiện trên ERPNext</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Người dùng</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-center">Đọc</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-center">Ghi</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-center">Chia sẻ</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-center">Mọi người</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((s, i) => (
                    <tr key={(s.name as string) || i} className={cn('border-b border-gray-100', i % 2 === 1 && 'bg-gray-50/50')}>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', avatarColor((s.user as string) || ''))}>
                            {initials((s.user as string) || '')}
                          </div>
                          <span className="text-gray-800">{(s.user as string) || 'Mọi người'}</span>
                        </div>
                      </td>
                      {[
                        [s.read, 'Đọc'],
                        [s.write, 'Ghi'],
                        [s.share, 'Chia sẻ'],
                        [s.everyone, 'Mọi người'],
                      ].map(([val, _label], j) => (
                        <td key={j} className="px-5 py-2.5 text-center">
                          {Number(val) ? (
                            <span className="text-green-600 text-base">✓</span>
                          ) : (
                            <span className="text-gray-300 text-base">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-2.5 text-gray-400 text-xs">{formatDate((s.creation as string) || '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
