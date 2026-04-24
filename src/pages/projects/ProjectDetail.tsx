import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Building2,
  Calendar,
  ClipboardList,
  Clock3,
  DollarSign,
  ExternalLink,
  FolderKanban,
  MessageSquare,
  Paperclip,
  Percent,
  Plus,
  Send,
  Target,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { assignToApi, callMethodDirect, getDoc, searchLink, uploadAttachment } from '../../services/api';
import { cn, formatCurrency, formatDate, formatDateTime, formatNumber } from '../../lib/utils';

interface ProjectUserInfo {
  fullname?: string;
  image?: string | null;
  name?: string;
  email?: string;
}

interface ProjectComment {
  name: string;
  content: string;
  owner: string;
  creation: string;
  comment_type: string;
}

interface ProjectAttachment {
  name: string;
  file_name: string;
  file_url: string;
  is_private: number;
}

interface ProjectAssignment {
  name: string;
  owner: string;
  description: string;
}

interface ProjectLogEntry {
  name: string;
  content: string;
  owner: string;
  creation: string;
  comment_type: string;
}

interface ProjectDocInfo {
  user_info: Record<string, ProjectUserInfo>;
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
  assignments: ProjectAssignment[];
  assignment_logs: ProjectLogEntry[];
  attachment_logs: ProjectLogEntry[];
}

interface ProjectRecord {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  project_name: string;
  status: string;
  project_type?: string | null;
  priority?: string | null;
  percent_complete: number;
  percent_complete_method?: string | null;
  is_active?: string | null;
  expected_start_date?: string | null;
  expected_end_date?: string | null;
  actual_time?: number;
  estimated_costing?: number;
  total_costing_amount?: number;
  total_expense_claim?: number;
  total_purchase_cost?: number;
  total_sales_amount?: number;
  total_billable_amount?: number;
  total_billed_amount?: number;
  total_consumed_material_cost?: number;
  gross_margin?: number;
  per_gross_margin?: number;
  company?: string | null;
  users?: unknown[];
}

type Tab = 'overview' | 'activity' | 'assign' | 'attachments';

type ActivityItem =
  | {
      key: string;
      type: 'comment';
      owner: string;
      time: string;
      label: string;
      content: string;
    }
  | {
      key: string;
      type: 'assignment' | 'attachment';
      owner: string;
      time: string;
      label: string;
      content: string;
      attachmentUrl?: string | null;
    };

const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  { key: 'overview', label: 'Tổng quan', icon: <ClipboardList size={15} /> },
  { key: 'activity', label: 'Hoạt động', icon: <MessageSquare size={15} /> },
  { key: 'assign', label: 'Phân công', icon: <UserCheck size={15} /> },
  { key: 'attachments', label: 'Tệp đính kèm', icon: <Paperclip size={15} /> },
];

function stripHtml(html: string) {
  const el = document.createElement('div');
  el.innerHTML = html || '';
  return (el.textContent || el.innerText || '').trim();
}

function wrapCommentHtml(text: string) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const paragraphs = escaped
    .split(/\r?\n/)
    .map((line) => `<p>${line || '<br>'}</p>`)
    .join('');
  return `<div class="ql-editor read-mode">${paragraphs}</div>`;
}

function initials(value: string) {
  return (value || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function avatarColor(value: string) {
  const colors = [
    'bg-amber-100 text-amber-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
  ];
  return colors[(value || '').charCodeAt(0) % colors.length];
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default function ProjectDetail() {
  const { name } = useParams<{ name: string }>();
  const { user } = useAuth();
  const ERP_HOST = 'https://erp.mte.vn';

  const [doc, setDoc] = useState<ProjectRecord | null>(null);
  const [docinfo, setDocinfo] = useState<ProjectDocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  const [assignTo, setAssignTo] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignPriority, setAssignPriority] = useState('Medium');
  const [assignDate, setAssignDate] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuggestions, setAssignSuggestions] = useState<Array<{ value: string; description: string; label: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [removingAssignUser, setRemovingAssignUser] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const assignInputRef = useRef<HTMLInputElement>(null);

  const loadProject = useCallback(async (projectName: string) => {
    setLoading(true);
    try {
      const res = await getDoc<ProjectRecord>('Project', projectName);
      setDoc(res.docs[0] || null);
      setDocinfo(res.docinfo as ProjectDocInfo);
    } catch {
      setDoc(null);
      setDocinfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!name) return;
    loadProject(name);
  }, [loadProject, name]);

  const userInfo = docinfo?.user_info || {};

  const getUserLabel = useCallback((userName?: string | null) => {
    if (!userName) return '—';
    return userInfo[userName]?.fullname || userInfo[userName]?.name || userName;
  }, [userInfo]);

  const comments = useMemo(
    () =>
      (docinfo?.comments || [])
        .filter((item) => item.comment_type === 'Comment')
        .sort((a, b) => new Date(b.creation).getTime() - new Date(a.creation).getTime()),
    [docinfo],
  );

  const assignments = useMemo(() => docinfo?.assignments || [], [docinfo]);
  const attachments = useMemo(() => docinfo?.attachments || [], [docinfo]);

  const activityItems = useMemo<ActivityItem[]>(() => {
    const assignmentLogs = (docinfo?.assignment_logs || []).map((item) => {
      const match = item.content.match(/ assigned ([^:]+):\s*/);
      const assignee = match ? match[1].trim() : '';
      const detail = item.content.includes(':') ? stripHtml(item.content.split(':').slice(1).join(':')) : '';
      return {
        key: `assignment-${item.name}`,
        type: 'assignment' as const,
        owner: item.owner,
        time: item.creation,
        label: assignee ? `${getUserLabel(item.owner)} giao việc cho ${assignee}` : stripHtml(item.content),
        content: detail,
      };
    });

    const attachmentLogs = (docinfo?.attachment_logs || []).map((item) => {
      const hrefMatch = item.content.match(/href="([^"]+)"/);
      const nameMatch = item.content.match(/>([^<]+)</);
      const fileName = nameMatch ? nameMatch[1] : 'Tệp đính kèm';
      return {
        key: `attachment-${item.name}`,
        type: 'attachment' as const,
        owner: item.owner,
        time: item.creation,
        label: `${getUserLabel(item.owner)} đính kèm ${fileName}`,
        content: '',
        attachmentUrl: hrefMatch ? hrefMatch[1] : null,
      };
    });

    const commentItems = comments.map((item) => ({
      key: `comment-${item.name}`,
      type: 'comment' as const,
      owner: item.owner,
      time: item.creation,
      label: getUserLabel(item.owner),
      content: stripHtml(item.content) || 'Bình luận trống',
    }));

    return [...assignmentLogs, ...attachmentLogs, ...commentItems].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }, [comments, docinfo, getUserLabel]);

  const summaryItems = doc ? [
    { label: 'Mã dự án', value: doc.name },
    { label: 'Công ty', value: doc.company || '—' },
    { label: 'Loại dự án', value: doc.project_type || '—' },
    { label: 'Ưu tiên', value: doc.priority || '—' },
    { label: 'Trạng thái hoạt động', value: doc.is_active || '—' },
    { label: 'Phương pháp tiến độ', value: doc.percent_complete_method || '—' },
    { label: 'Tạo bởi', value: getUserLabel(doc.owner) },
    { label: 'Cập nhật bởi', value: getUserLabel(doc.modified_by) },
    { label: 'Tạo lúc', value: formatDateTime(doc.creation) },
    { label: 'Cập nhật lúc', value: formatDateTime(doc.modified) },
  ] : [];

  const metrics = doc ? [
    { label: 'Tiến độ', value: `${formatNumber(doc.percent_complete || 0, 0)}%`, icon: <Percent size={18} /> },
    { label: 'Thời gian thực tế', value: `${formatNumber(doc.actual_time || 0, 1)} giờ`, icon: <Clock3 size={18} /> },
    { label: 'Chi phí ước tính', value: formatCurrency(doc.estimated_costing || 0), icon: <Target size={18} /> },
    { label: 'Tổng chi phí', value: formatCurrency(doc.total_costing_amount || 0), icon: <DollarSign size={18} /> },
  ] : [];

  const financeItems = doc ? [
    { label: 'Chi phí mua hàng', value: formatCurrency(doc.total_purchase_cost || 0) },
    { label: 'Chi phí vật tư tiêu hao', value: formatCurrency(doc.total_consumed_material_cost || 0) },
    { label: 'Chi phí đề nghị thanh toán', value: formatCurrency(doc.total_expense_claim || 0) },
    { label: 'Doanh thu bán hàng', value: formatCurrency(doc.total_sales_amount || 0) },
    { label: 'Billable amount', value: formatCurrency(doc.total_billable_amount || 0) },
    { label: 'Đã xuất hóa đơn', value: formatCurrency(doc.total_billed_amount || 0) },
    { label: 'Gross margin', value: formatCurrency(doc.gross_margin || 0) },
    { label: 'Tỷ lệ gross margin', value: `${formatNumber(doc.per_gross_margin || 0, 2)}%` },
  ] : [];

  const handleSubmitComment = async () => {
    if (!doc || !commentText.trim()) return;
    setSubmittingComment(true);
    setCommentError('');
    try {
      await callMethodDirect('frappe.desk.form.utils.add_comment', {
        reference_doctype: 'Project',
        reference_name: doc.name,
        content: wrapCommentHtml(commentText.trim()),
        comment_email: user?.email || doc.owner,
        comment_by: user?.full_name || getUserLabel(doc.owner),
      });
      setCommentText('');
      await loadProject(doc.name);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Không gửi được bình luận.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAssignSearch = async (text: string) => {
    setAssignTo(text);
    if (!text.trim()) {
      setAssignSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const results = await searchLink('User', text, { user_type: 'System User', enabled: '1' });
      setAssignSuggestions(results);
      setShowSuggestions(true);
    } catch {
      setAssignSuggestions([]);
    }
  };

  const handleAssign = async () => {
    if (!doc || !assignTo.trim()) return;
    setAssignLoading(true);
    setAssignError('');
    try {
      await assignToApi.add({
        doctype: 'Project',
        name: doc.name,
        assignTo: [assignTo.trim()],
        date: assignDate,
        priority: assignPriority,
        description: wrapCommentHtml(assignDesc.trim()),
      });
      setAssignTo('');
      setAssignDesc('');
      setAssignPriority('Medium');
      setAssignDate('');
      setAssignSuggestions([]);
      setShowSuggestions(false);
      await loadProject(doc.name);
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'Không giao việc được.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveAssign = async (assignToUser: string) => {
    if (!doc || !assignToUser) return;
    setRemovingAssignUser(assignToUser);
    setAssignError('');
    try {
      await assignToApi.remove({
        doctype: 'Project',
        name: doc.name,
        assignTo: assignToUser,
      });
      await loadProject(doc.name);
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'Không gỡ phân công được.');
    } finally {
      setRemovingAssignUser('');
    }
  };

  const handleUploadFile = async () => {
    if (!doc || !selectedFile) return;
    setUploadingFile(true);
    setUploadError('');
    try {
      await uploadAttachment({
        doctype: 'Project',
        docname: doc.name,
        file: selectedFile,
        isPrivate: false,
      });
      setSelectedFile(null);
      const input = document.getElementById('project-attachment-input') as HTMLInputElement | null;
      if (input) input.value = '';
      await loadProject(doc.name);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Không upload được tệp.');
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageLoader rows={4} />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-6xl page-enter">
        <PageHeader title="Không tìm thấy dự án" backTo="/projects/projects" />
        <div className="card card-body py-12 text-center text-gray-400">
          Dự án không tồn tại hoặc bạn không còn quyền truy cập.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl page-enter">
      <PageHeader
        title={doc.project_name || doc.name}
        subtitle={`Mã: ${doc.name}`}
        backTo="/projects/projects"
        badge={<StatusBadge status={doc.status} />}
        actions={(
          <a
            href={`${ERP_HOST}/desk/project/${encodeURIComponent(doc.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <ExternalLink size={15} />
            ERP
          </a>
        )}
      />

      <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              tab === item.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {item.icon}
            {item.label}
            {item.key === 'assign' && assignments.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {assignments.length}
              </span>
            )}
            {item.key === 'attachments' && attachments.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs text-white">
                {attachments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((item) => (
              <MetricCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-gray-800">Thông tin chính</h2>
                </div>
                <div className="grid gap-x-6 gap-y-2 px-5 py-2 md:grid-cols-2">
                  <InfoRow label="Ngày bắt đầu dự kiến" value={formatDate(doc.expected_start_date)} />
                  <InfoRow label="Ngày kết thúc dự kiến" value={formatDate(doc.expected_end_date)} />
                  <InfoRow label="Loại dự án" value={doc.project_type || '—'} />
                  <InfoRow label="Ưu tiên" value={doc.priority || '—'} />
                  <InfoRow label="Trạng thái hoạt động" value={doc.is_active || '—'} />
                  <InfoRow label="Số người tham gia" value={String(doc.users?.length || 0)} />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-gray-800">Ngân sách và hiệu quả</h2>
                </div>
                <div className="grid gap-x-6 gap-y-2 px-5 py-2 md:grid-cols-2">
                  {financeItems.map((item) => (
                    <InfoRow key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-4">
                  <h2 className="text-sm font-semibold text-gray-800">Tóm tắt dự án</h2>
                </div>
                <div className="px-4 py-1">
                  {summaryItems.map((item) => (
                    <InfoRow key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-gray-800">
                  <FolderKanban size={18} />
                  <h2 className="text-sm font-semibold">Tiến độ hiện tại</h2>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                  <span>{doc.status || 'Open'}</span>
                  <span>{formatNumber(doc.percent_complete || 0, 0)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, Number(doc.percent_complete || 0)))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-gray-800">
                  <Building2 size={18} />
                  <h2 className="text-sm font-semibold">Doanh nghiệp</h2>
                </div>
                <p className="text-sm leading-6 text-gray-600">{doc.company || 'Chưa gán công ty'}</p>
              </div>
            </aside>
          </div>
        </div>
      ) : null}

      {tab === 'activity' ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Hoạt động gần đây</h2>
                <p className="mt-1 text-sm text-gray-500">Bình luận, giao việc và tệp đính kèm của dự án.</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                {activityItems.length} mục
              </span>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="flex items-start gap-3">
              <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold', avatarColor(user?.full_name || user?.email || 'User'))}>
                {initials(user?.full_name || user?.email || 'User')}
              </div>
              <div className="flex-1">
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
                  placeholder="Viết bình luận... Ctrl/Cmd + Enter để gửi"
                  className="textarea-field"
                />
                {commentError ? <p className="mt-2 text-sm text-red-600">{commentError}</p> : null}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="btn btn-primary btn-sm"
                  >
                    <Send size={14} />
                    {submittingComment ? 'Đang gửi' : 'Gửi bình luận'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-gray-800">
                <ClipboardList size={16} />
                <span className="text-sm font-medium">Bản ghi dự án</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Tạo lúc</p>
                  <p className="mt-1 text-sm text-gray-700">{formatDateTime(doc.creation)}</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Cập nhật gần nhất</p>
                  <p className="mt-1 text-sm text-gray-700">{formatDateTime(doc.modified)}</p>
                </div>
              </div>
            </div>

            {activityItems.length ? (
              <div className="space-y-4">
                {activityItems.map((item) => (
                  <div key={item.key} className="rounded-lg bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-3">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold', avatarColor(item.owner))}>
                        {initials(getUserLabel(item.owner))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(item.time)}</p>
                      </div>
                    </div>
                    {item.content ? (
                      <div className="flex items-start gap-2 text-sm leading-6 text-gray-700">
                        <MessageSquare size={16} className="mt-1 shrink-0 text-gray-400" />
                        <p>{item.content}</p>
                      </div>
                    ) : null}
                    {item.type === 'attachment' && item.attachmentUrl ? (
                      <a
                        href={`${ERP_HOST}${item.attachmentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-blue-700 hover:bg-slate-100"
                      >
                        <Paperclip size={14} />
                        Mở tệp đính kèm
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-400">Chưa có hoạt động nào.</div>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'assign' ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-800">Phân công</h2>
            <p className="mt-1 text-sm text-gray-500">Giao việc cho thành viên và quản lý các phân công đang mở.</p>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Plus size={14} />
                Thêm phân công mới
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <label className="mb-1 block text-xs text-gray-500">Người được giao</label>
                  <input
                    ref={assignInputRef}
                    value={assignTo}
                    onChange={(e) => { void handleAssignSearch(e.target.value); }}
                    onFocus={() => {
                      if (assignSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Chọn hoặc gõ tên người dùng..."
                    className="input-field"
                  />
                  {showSuggestions && assignSuggestions.length > 0 ? (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                      {assignSuggestions.map((option) => (
                        <button
                          key={option.value}
                          onMouseDown={() => {
                            setAssignTo(option.value);
                            setShowSuggestions(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-blue-50"
                        >
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {initials(option.description || option.value)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">{option.description || option.value}</p>
                            <p className="truncate text-xs text-gray-400">{option.value}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">Ngày hết hạn</label>
                  <input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} className="input-field" />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">Độ ưu tiên</label>
                  <select value={assignPriority} onChange={(e) => setAssignPriority(e.target.value)} className="select-field">
                    <option value="Low">Thấp</option>
                    <option value="Medium">Trung bình</option>
                    <option value="High">Cao</option>
                    <option value="Urgent">Khẩn cấp</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Mô tả</label>
                  <textarea
                    value={assignDesc}
                    onChange={(e) => setAssignDesc(e.target.value)}
                    rows={3}
                    placeholder="Nội dung công việc..."
                    className="textarea-field"
                  />
                </div>
              </div>

              {assignError ? <p className="mt-3 text-sm text-red-600">{assignError}</p> : null}

              <button onClick={handleAssign} disabled={!assignTo.trim() || assignLoading} className="btn btn-primary mt-3">
                <Plus size={14} />
                {assignLoading ? 'Đang giao việc' : 'Giao việc'}
              </button>
            </div>

            {assignments.length ? (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment.name} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                    <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold', avatarColor(assignment.owner))}>
                      {initials(getUserLabel(assignment.owner))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{getUserLabel(assignment.owner)}</span>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Đang được giao</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{stripHtml(assignment.description) || 'Không có mô tả'}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveAssign(assignment.owner)}
                      disabled={removingAssignUser === assignment.owner}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Gỡ phân công"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-gray-400">Chưa có phân công nào.</div>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'attachments' ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-800">Tệp đính kèm</h2>
            <p className="mt-1 text-sm text-gray-500">Upload một tệp mỗi lần và mở trực tiếp từ ERP.</p>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <label className="mb-2 block text-xs text-gray-500">Chọn tệp</label>
              <input
                id="project-attachment-input"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              />
              {selectedFile ? (
                <p className="mt-2 text-sm text-gray-600">Đã chọn: {selectedFile.name}</p>
              ) : null}
              {uploadError ? <p className="mt-2 text-sm text-red-600">{uploadError}</p> : null}
              <button onClick={handleUploadFile} disabled={!selectedFile || uploadingFile} className="btn btn-primary mt-3">
                <Upload size={14} />
                {uploadingFile ? 'Đang upload' : 'Upload tệp'}
              </button>
            </div>

            {attachments.length ? (
              <div className="space-y-3">
                {attachments.map((file) => (
                  <a
                    key={file.name}
                    href={`${ERP_HOST}${file.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Paperclip size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{file.file_name}</p>
                      <p className="text-xs text-gray-400">{file.is_private ? 'Private file' : 'Public file'}</p>
                    </div>
                    <ExternalLink size={15} className="text-gray-400" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-gray-400">Chưa có tệp đính kèm nào.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
