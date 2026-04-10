import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe, Coins, Hash } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { companyApi } from '../../services/api';

interface CompanyRecord {
  name: string;
  company_name: string;
  default_currency: string;
}

interface CompanyDetail {
  name: string;
  company_name: string;
  default_currency: string;
  default_holiday_list?: string;
  tax_id?: string;
  website?: string;
  phone_no?: string;
  email?: string;
  country?: string;
  date_of_establishment?: string;
  parent_company?: string;
  is_group?: number;
}

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [details, setDetails] = useState<Record<string, CompanyDetail>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchList = () => {
    setLoading(true);
    companyApi.list({
      fields: JSON.stringify(['name', 'company_name', 'default_currency']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'company_name asc',
    })
      .then(res => {
        const list = res.data?.data || [];
        setCompanies(list);
        setTotal(res.data?.count || 0);
        // fetch detail for each company
        return Promise.all(
          list.map((c: CompanyRecord) =>
            companyApi.get(c.name).then(r => ({ name: c.name, data: r.data?.data }))
          )
        );
      })
      .then(results => {
        const map: Record<string, CompanyDetail> = {};
        results.forEach((r) => {
          if (r?.data) map[r.name] = r.data;
        });
        setDetails(map);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [page]);

  const columns = [
    {
      key: 'name', label: 'Mã công ty', sortable: true, minWidth: '140px',
      render: (_: unknown, row: CompanyRecord) => (
        <button onClick={() => navigate(`/settings/companies/${row.name}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {row.name}
        </button>
      ),
    },
    { key: 'company_name', label: 'Tên công ty', sortable: true, minWidth: '200px' },
    {
      key: 'default_currency', label: 'Tiền tệ', minWidth: '120px',
      render: (v: unknown) => (
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Coins size={14} className="text-yellow-500" />
          {String(v)}
        </span>
      ),
    },
    {
      key: 'name', label: 'Chi tiết', minWidth: '80px',
      render: (_: unknown, row: CompanyRecord) =>
        details[row.name] ? (
          <button onClick={() => navigate(`/settings/companies/${row.name}`)} className="btn btn-secondary text-xs py-1">
            Xem
          </button>
        ) : null,
    },
  ];

  const selected = companies[0];
  const detail = selected ? details[selected.name] : null;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Công ty"
        subtitle={`${total} công ty`}
      />

      <div className="flex flex-col gap-4">
        {/* Detail card */}
        {!loading && detail && (
          <div className="card card-body p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={24} className="text-blue-600" />
              </div>
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailField icon={<Building2 size={14} />} label="Tên công ty" value={detail.company_name} />
                <DetailField icon={<Hash size={14} />} label="Mã số thuế" value={detail.tax_id} />
                <DetailField icon={<Coins size={14} />} label="Tiền tệ mặc định" value={detail.default_currency} />
                <DetailField icon={<Globe size={14} />} label="Quốc gia" value={detail.country} />
                <DetailField icon={<Globe size={14} />} label="Website" value={detail.website} />
                <DetailField icon={<Globe size={14} />} label="Ngày thành lập" value={detail.date_of_establishment} />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card card-body p-0">
          {loading ? (
            <PageLoader rows={6} />
          ) : (
            <DataTable
              columns={columns}
              data={companies}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onRowClick={(row) => navigate(`/settings/companies/${row.name}`)}
              emptyText="Chưa có công ty"
              emptyIcon={<Building2 size={32} className="text-gray-300" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">{icon}{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
