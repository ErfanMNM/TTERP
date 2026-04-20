import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ExternalLink,
  Calendar,
  CircleDashed,
  Clock3,
  Link2,
  MessageSquare,
  RotateCcw,
  Save,
  Send,
  User,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { cn, formatDate, formatDateTime } from '../../lib/utils';
import { callMethodDirect, getDoc, toDoApi } from '../../services/api';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

interface Version {
  name: string;
  owner: string;
  creation: string;
  data: string;
}

interface Comment {
  name: string;
  content: string;
  owner: string;
  creation: string;
}

interface ToDoDetailRecord {
  name: string;
  owner: string;
  status: string;
  priority: string;
  color: string;
  date: string;
  allocated_to: string;
  description: string;
  reference_type: string;
  reference_name: string;
  assigned_by: string;
  assigned_by_full_name: string;
  creation: string;
  modified: string;
  modified_by: string;
}

interface DocInfo {
  user_info: Record<string, { fullname: string; image: string | null; name: string; email: string }>;
  comments: Comment[];
  versions: Version[];
  attachments: unknown[];
  assignments: unknown[];
}

interface TodoFormState {
  status: string;
  priority: string;
  color: string;
  date: string;
  description: string;
}

type Tab = 'general' | 'activity';

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
const STATUS_OPTIONS = ['Open', 'Closed', 'Cancelled'];

const STATUS_TONE: Record<string, string> = {
  Open: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Closed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const PRIORITY_TONE: Record<string, string> = {
  High: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

function normalizeColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#8ab4f8';
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

export default function TodoDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ERP_HOST = 'https://erp.mte.vn';

  const [data, setData] = useState<ToDoDetailRecord | null>(null);
  const [docinfo, setDocinfo] = useState<DocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [tab, setTab] = useState<Tab>('general');
  const [form, setForm] = useState<TodoFormState>({
    status: 'Open',
    priority: 'Medium',
    color: '#8ab4f8',
    date: '',
    description: '',
  });
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadTodo = useCallback(async (todoName: string) => {
    setLoading(true);
    try {
      const res = await getDoc<ToDoDetailRecord>('ToDo', todoName);
      const doc = res.docs[0];
      setData(doc);
      setForm({
        status: doc.status || 'Open',
        priority: doc.priority || 'Medium',
        color: normalizeColor(doc.color || '#8ab4f8'),
        date: doc.date || '',
        description: stripHtml(doc.description || ''),
      });
      setDocinfo(res.docinfo as DocInfo);
      setSaveState('idle');
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!name) return;
    loadTodo(name);
  }, [loadTodo, name]);

  const userMap = docinfo?.user_info || {};

  const getUserName = useCallback((email: string) => {
    return userMap[email]?.fullname || userMap[email]?.name || email || '—';
  }, [userMap]);

  const initialForm = useMemo<TodoFormState | null>(() => {
    if (!data) return null;
    return {
      status: data.status || 'Open',
      priority: data.priority || 'Medium',
      color: normalizeColor(data.color || '#8ab4f8'),
      date: data.date || '',
      description: stripHtml(data.description || ''),
    };
  }, [data]);

  const isDirty = useMemo(() => {
    if (!initialForm) return false;
    return JSON.stringify(initialForm) !== JSON.stringify(form);
  }, [form, initialForm]);

  const saveLabel = saving
    ? 'Đang lưu thay đổi'
    : saveState === 'saved'
      ? 'Đã lưu'
      : saveState === 'error'
        ? 'Lưu thất bại'
        : isDirty
          ? 'Có thay đổi chưa lưu'
          : 'Đã đồng bộ';

  const handleFieldChange = <K extends keyof TodoFormState>(field: K, value: TodoFormState[K]) => {
    setSaveState('idle');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiscard = () => {
    if (!initialForm) return;
    setForm(initialForm);
    setSaveState('idle');
  };

  const handleSave = async () => {
    if (!data || !isDirty) return;

    setSaving(true);
    setSaveState('idle');

    try {
      await toDoApi.update(data.name, {
        status: form.status,
        priority: form.priority,
        color: normalizeColor(form.color),
        date: form.date || null,
        description: form.description,
      });
      await loadTodo(data.name);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !data) return;

    setSubmittingComment(true);
    try {
      await callMethodDirect('frappe.desk.form.utils.add_comment', {
        reference_doctype: 'ToDo',
        reference_name: data.name,
        content: `<div class="ql-editor read-mode"><p>${commentText}</p></div>`,
        comment_email: user?.email || data.owner,
        comment_by: user?.full_name || getUserName(data.owner),
      });
      setCommentText('');
      await loadTodo(data.name);
    } finally {
      setSubmittingComment(false);
    }
  };

  const parseVersion = (dataStr: string): { changed: [string, string, string][] } => {
    try {
      return JSON.parse(dataStr);
    } catch {
      return { changed: [] };
    }
  };

  const infoItems = data ? [
    { label: 'Mã công việc', value: data.name },
    { label: 'Phụ trách', value: getUserName(data.allocated_to) },
    { label: 'Giao bởi', value: getUserName(data.assigned_by) },
    { label: 'Liên kết', value: data.reference_name ? `${data.reference_type || 'Tài liệu'} · ${data.reference_name}` : 'Không có' },
    { label: 'Tạo lúc', value: formatDateTime(data.creation) },
    { label: 'Cập nhật', value: formatDateTime(data.modified) },
  ] : [];

  const activityItems = useMemo(() => {
    const versionItems = (docinfo?.versions || []).map((version) => ({
      key: `version-${version.name}`,
      type: 'history' as const,
      owner: version.owner,
      creation: version.creation,
      changed: parseVersion(version.data).changed,
    }));

    const commentItems = (docinfo?.comments || []).map((comment) => ({
      key: `comment-${comment.name}`,
      type: 'comment' as const,
      owner: comment.owner,
      creation: comment.creation,
      content: stripHtml(comment.content),
    }));

    return [...commentItems, ...versionItems]
      .sort((a, b) => new Date(b.creation).getTime() - new Date(a.creation).getTime());
  }, [docinfo, getUserName]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-10 w-72 animate-pulse rounded-full bg-gray-100" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_340px]">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="mb-4 h-16 animate-pulse rounded-2xl bg-gray-50" />
            ))}
          </div>
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            {[1, 2, 3].map((item) => (
              <div key={item} className="mb-4 h-24 animate-pulse rounded-2xl bg-gray-50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl rounded-[28px] border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Không tìm thấy ToDo</h2>
        <p className="mt-2 text-sm text-gray-500">Bản ghi có thể đã bị xóa hoặc bạn không còn quyền truy cập.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl page-enter">
      <PageHeader
        title={form.description || 'Không có mô tả'}
        subtitle={`Mã: ${data.name}`}
        backTo="/projects/todos"
        badge={(
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_TONE[form.status] || STATUS_TONE.Open)}>
              {form.status}
            </span>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', PRIORITY_TONE[form.priority] || PRIORITY_TONE.Medium)}>
              {form.priority}
            </span>
          </div>
        )}
        actions={(
          <>
            <a
              href={`${ERP_HOST}/desk/todo/${encodeURIComponent(data.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex items-center gap-1.5"
            >
              <ExternalLink size={15} />
              ERP
            </a>
            {isDirty && (
              <button onClick={handleDiscard} className="btn btn-ghost border border-gray-200 bg-white">
                <RotateCcw size={16} />
                Hoàn tác
              </button>
            )}
            <button onClick={handleSave} disabled={!isDirty || saving} className="btn btn-primary">
              <Save size={16} />
              {saving ? 'Đang lưu' : 'Lưu'}
            </button>
          </>
        )}
      />

      <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-gray-200">
        {[
          { key: 'general' as const, label: 'Tổng quan' },
          { key: 'activity' as const, label: 'Hoạt động' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              tab === item.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'general' ? (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="grid gap-x-6 gap-y-5 p-5 md:grid-cols-2">
              <Field label="Trạng thái">
                <select
                  value={form.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="select-field"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>

              <Field label="Ưu tiên">
                <select
                  value={form.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  className="select-field"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>

              <Field label="Ngày hẹn">
                <input
                  type="date"
                  value={form.date ? form.date.slice(0, 10) : ''}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="input-field"
                />
              </Field>

              <Field label="Màu nhận diện">
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <input
                    type="color"
                    value={normalizeColor(form.color)}
                    onChange={(e) => handleFieldChange('color', e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-xl border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => handleFieldChange('color', e.target.value)}
                    className="input-field"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Description</h2>
            </div>
            <div className="p-5">
              <textarea
                value={form.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={10}
                placeholder="Nhập nội dung công việc..."
                className="textarea-field min-h-[260px] rounded-lg"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Reference</h2>
            </div>
            <div className="grid gap-x-6 gap-y-5 p-5 md:grid-cols-2">
              <Field label="Reference Type">
                <div className="input-field rounded-lg bg-gray-50 text-gray-700">{data.reference_type || 'Không có'}</div>
              </Field>

              <Field label="Role">
                <div className="input-field rounded-lg bg-gray-50 text-gray-700">—</div>
              </Field>

              <Field label="Reference Name">
                <div className="input-field rounded-lg bg-gray-50 text-gray-700">{data.reference_name || 'Không có'}</div>
              </Field>

              <Field label="Assigned By">
                <div className="input-field rounded-lg bg-gray-50 text-gray-700">{getUserName(data.assigned_by)}</div>
              </Field>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">{form.description || 'ToDo'}</h2>
              <p className="mt-1 text-sm text-gray-500">{data.name}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {infoItems.map((item) => (
                <div key={item.label} className="px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 break-words">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      ) : (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Hoạt động</h2>
              <p className="mt-1 text-sm text-gray-500">Bình luận và lịch sử cập nhật của công việc.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
              {activityItems.length} mục
            </span>
          </div>
        </div>

        <div className="max-h-[520px] space-y-4 overflow-y-auto px-5 py-5">
          {activityItems.length ? (
            activityItems.map((item) => (
              <div key={item.key} className="rounded-lg bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    item.type === 'comment' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600',
                  )}>
                    {getUserName(item.owner).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {getUserName(item.owner)}
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {item.type === 'comment' ? 'đã bình luận' : 'đã cập nhật'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(item.creation)}</p>
                  </div>
                </div>

                {item.type === 'comment' ? (
                  <p className="text-sm leading-6 text-gray-700">{item.content}</p>
                ) : item.changed.length ? (
                  <div className="space-y-1 text-sm text-gray-600">
                    {item.changed.map(([field, from, to]) => (
                      <p key={`${item.key}-${field}`}>
                        <span className="font-medium text-gray-800">{field}</span>: <span className="text-gray-400 line-through break-all">{from}</span> → <span className="break-all">{to}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Không có chi tiết thay đổi.</p>
                )}
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">Chưa có hoạt động nào.</div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            rows={3}
            placeholder="Nhập bình luận... Ctrl/Cmd + Enter để gửi"
            className="textarea-field"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || submittingComment}
              className="btn btn-primary btn-sm"
            >
              <Send size={14} />
              {submittingComment ? 'Đang gửi' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
