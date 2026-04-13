import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Warehouse, Activity, Send, Pencil, Trash2, X, Check, ExternalLink } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { itemApi, stockBalanceApi, commentApi, versionApi, toDoApi } from '../../services/api';
import { formatDate, formatCurrency, formatNumber, cn } from '../../lib/utils';

interface ItemData {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  description?: string;
  brand?: string;
  disabled: number;
  standard_rate?: number;
  valuation_rate?: number;
  created_on?: string;
  modified?: string;
  [key: string]: unknown;
}

interface StockRow {
  warehouse: string;
  actual_qty: number;
  projected_qty: number;
}

interface CommentRow {
  name: string;
  comment_type: string;
  content: string;
  owner: string;
  creation: string;
}

interface VersionRow {
  name: string;
  owner: string;
  modified: string;
  ref_doctype: string;
  docname: string;
  data: string;
}

export default function ItemDetail() {
  const ERP_HOST = 'https://erp.mte.vn';
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    Promise.all([
      itemApi.get(name),
      stockBalanceApi.list({ item_code: name, limit: 100 }),
      commentApi.list({
        filters: JSON.stringify([
          ['Comment', 'reference_doctype', '=', 'Item'],
          ['Comment', 'reference_name', '=', name],
        ]),
        fields: JSON.stringify(['name', 'comment_type', 'content', 'owner', 'creation']),
        order_by: 'creation desc',
        limit_page_length: 50,
      }),
      versionApi.list({
        filters: JSON.stringify([['Version', 'docname', '=', name]]),
        fields: JSON.stringify(['name', 'owner', 'modified', 'data']),
        order_by: 'modified desc',
        limit_page_length: 20,
      }),
    ])
      .then(([itemRes, stockRes, commentRes, versionRes]) => {
        setData(itemRes.data?.data || itemRes.data);
        const bins: StockRow[] = Array.isArray(stockRes.message) ? stockRes.message : [];
        setStockRows(bins);
        const cmts: CommentRow[] = Array.isArray(commentRes.data?.data) ? commentRes.data.data : [];
        setComments(cmts);
        const vers: VersionRow[] = Array.isArray(versionRes.data?.data) ? versionRes.data.data : [];
        setVersions(vers);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [name]);

  const refreshComments = async () => {
    const res = await commentApi.list({
      filters: JSON.stringify([
        ['Comment', 'reference_doctype', '=', 'Item'],
        ['Comment', 'reference_name', '=', name],
      ]),
      fields: JSON.stringify(['name', 'comment_type', 'content', 'owner', 'creation']),
      order_by: 'creation desc',
      limit_page_length: 50,
    });
    const cmts: CommentRow[] = Array.isArray(res.data?.data) ? res.data.data : [];
    setComments(cmts);
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
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await commentApi.update(id, { content: editContent.trim() });
      setEditingId(null);
      await refreshComments();
    } catch { /* silent */ }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await commentApi.delete(id);
      await refreshComments();
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

  // Parse attachment links from comment content (ERPNext embeds file links in content HTML)
  const parseAttachmentLink = (content: string): string | null => {
    const match = content.match(/href="(\/files\/[^"]+)"/);
    return match ? match[1] : null;
  };

  // Parse assignment comment: "X assigned Y: description"
  const parseAssignment = (content: string): { assigner: string; assignee: string; desc: string } | null => {
    const match = content.match(/^(.+?)\s+assigned\s+(.+?):\s*(.+)$/);
    if (!match) return null;
    return { assigner: match[1].trim(), assignee: match[2].trim(), desc: stripHtml(match[3]) };
  };

  const parseVersionLabel = (row: VersionRow): { label: string; sub: string } => {
    try {
      const d = JSON.parse(row.data);
      if (d.changed) {
        // Field change: "X changed field from Y to Z"
        return {
          label: `${d.changed_by} đã thay đổi trường ${d.changed[0]}`,
          sub: formatDate(row.modified),
        };
      }
      if (d.created) {
        // Document creation via import
        return {
          label: `${d.created_by} đã tạo document`,
          sub: formatDate(row.modified),
        };
      }
      if (d.updater_reference?.label) {
        return { label: d.updater_reference.label, sub: formatDate(row.modified) };
      }
      return { label: `${d.created_by} đã tạo`, sub: formatDate(row.modified) };
    } catch {
      return { label: `${row.owner} đã cập nhật`, sub: formatDate(row.modified) };
    }
  };

  // Build activity feed — merge comments, assignments, and version history
  const allActivities = [
    ...comments.map(c => {
      // Assignments — stored as Comment but with reference_type=ToDo
      if (c.comment_type === 'Assignment') {
        const parsed = parseAssignment(c.content);
        if (parsed) {
          return {
            type: 'assignment' as const,
            label: `${parsed.assigner} assigned ${parsed.assignee} · ${formatDate(c.creation)}`,
            desc: parsed.desc,
            attachment: null,
            content: stripHtml(c.content),
            time: c.creation,
            owner: c.owner,
          };
        }
      }

      // Attachments — check for file links in content
      const link = parseAttachmentLink(c.content);
      if (link) {
        const filename = decodeURIComponent(link.split('/').pop() || link);
        return {
          type: 'attachment' as const,
          label: `${c.owner} đã đính kèm ${filename} · ${formatDate(c.creation)}`,
          attachment: link,
          desc: '',
          content: stripHtml(c.content),
          time: c.creation,
          owner: c.owner,
        };
      }

      // Regular comments
      return {
        type: 'comment' as const,
        label: `${c.owner} đã bình luận · ${formatDate(c.creation)}`,
        content: stripHtml(c.content),
        attachment: null,
        desc: '',
        time: c.creation,
        owner: c.owner,
      };
    }),
    ...versions.map(v => {
      const { label } = parseVersionLabel(v);
      return {
        type: 'version' as const,
        label: `${label} · ${formatDate(v.modified)}`,
        content: '',
        attachment: null,
        desc: '',
        time: v.modified,
        owner: v.owner,
      };
    }),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const initials = (s: string) => s.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const avatarColor = (s: string) => {
    const colors = ['bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700'];
    const idx = s.charCodeAt(0) % colors.length;
    return colors[idx];
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

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title={data.item_name || data.name}
        subtitle={`Mã: ${data.name}`}
        backTo="/stock/items"
        badge={<StatusBadge status={data.disabled === 1 ? 'Inactive' : 'Active'} />}
        actions={
          <a
            href={`${ERP_HOST}/app/item/${encodeURIComponent(data.name)}`}
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

      {/* Info cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Mã SKU</p>
          <p className="text-sm font-semibold text-gray-800">{data.item_code || '—'}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Nhóm</p>
          <p className="text-sm font-semibold text-gray-800">{data.item_group || '—'}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">ĐVT</p>
          <p className="text-sm font-semibold text-gray-800">{data.stock_uom || '—'}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Thương hiệu</p>
          <p className="text-sm font-semibold text-gray-800">{data.brand || '—'}</p>
        </div>
      </div>

      {/* Detail card */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-semibold text-gray-800">Thông tin chi tiết</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Mã vật tư (name)</span>
              <span className="text-sm text-gray-800 font-medium">{data.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Mã SKU</span>
              <span className="text-sm text-gray-800 font-medium">{data.item_code || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Tên vật tư</span>
              <span className="text-sm text-gray-800 font-medium">{data.item_name || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Nhóm vật tư</span>
              <span className="text-sm text-gray-800 font-medium">{data.item_group || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Đơn vị tính</span>
              <span className="text-sm text-gray-800 font-medium">{data.stock_uom || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Thương hiệu</span>
              <span className="text-sm text-gray-800 font-medium">{data.brand || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Giá tiêu chuẩn</span>
              <span className="text-sm text-gray-800 font-medium">{data.standard_rate ? formatCurrency(data.standard_rate) : '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Giá định giá</span>
              <span className="text-sm text-gray-800 font-medium">{data.valuation_rate ? formatCurrency(data.valuation_rate) : '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ngày tạo</span>
              <span className="text-sm text-gray-800 font-medium">{data.created_on ? formatDate(data.created_on) : '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ngày sửa</span>
              <span className="text-sm text-gray-800 font-medium">{data.modified ? formatDate(data.modified) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-800">Mô tả</h2>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{String(data.description)}</p>
          </div>
        </div>
      )}

      {/* Stock by warehouse */}
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Warehouse size={16} />
            Tồn kho theo kho
          </h2>
        </div>
        <div className="card-body p-0">
          {stockRows.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Không có dữ liệu tồn kho</p>
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

      {/* Comments + Activity */}
      <div className="card mt-4">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Activity size={16} />
            Hoạt động
          </h2>
          <span className="text-xs text-gray-400">{allActivities.length}</span>
        </div>
        <div className="card-body">
          {/* Comment input */}
          <div className="flex gap-3 items-start mb-5">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', avatarColor('User'))}>
              U
            </div>
            <div className="flex-1 flex gap-2">
              <textarea
                ref={commentRef}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Viết bình luận..."
                rows={2}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="btn btn-primary self-end px-3 py-2 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          {allActivities.length === 0 ? (
            <p className="text-center py-4 text-gray-400 text-sm">Chưa có hoạt động nào</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-4">
                {allActivities.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 pl-1 relative">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', avatarColor(item.owner))}>
                      {initials(item.owner)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Label */}
                      <p className="text-sm text-gray-700 leading-snug">{item.label}</p>

                      {/* Attachment preview */}
                      {item.type === 'attachment' && item.attachment && (
                        <a
                          href={`${ERP_HOST}${item.attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-gray-100 transition-colors"
                        >
                          <span className="truncate max-w-xs">{decodeURIComponent(item.attachment.split('/').pop() || '')}</span>
                        </a>
                      )}

                      {/* Assignment description */}
                      {item.type === 'assignment' && item.desc && (
                        <p className="mt-1 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">{item.desc}</p>
                      )}

                      {/* Comment content */}
                      {item.type === 'comment' && item.content && (
                        <p className="mt-1 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg whitespace-pre-wrap">{item.content}</p>
                      )}

                      {/* Edit/Delete actions */}
                      {item.type === 'comment' && (
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            onClick={() => {
                              const c = comments.find(cm => cm.creation === item.time);
                              if (c) { setEditingId(c.name); setEditContent(c.content); }
                            }}
                            className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            Sửa
                          </button>
                          <span className="text-xs text-gray-300">·</span>
                          <button
                            onClick={() => {
                              const c = comments.find(cm => cm.creation === item.time);
                              if (c) handleDeleteComment(c.name);
                            }}
                            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                          >
                            Xóa
                          </button>
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
    </div>
  );
}