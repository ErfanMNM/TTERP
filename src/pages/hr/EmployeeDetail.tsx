import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User, Briefcase, Building2, Calendar, Hash } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import { employeeApi } from '../../services/api';

interface Employee {
  name: string;
  employee_name: string;
  employee_id: string;
  designation: string;
  department: string;
  status: string;
  date_of_joining: string;
  company: string;
  branch: string;
  gender: string;
  date_of_birth: string;
  personal_email: string;
  cell_number: string;
}

export default function EmployeeDetail() {
  const { name } = useParams<{ name: string }>();
  const [data, setData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name || name === 'new') {
      setLoading(false);
      return;
    }
    employeeApi.get(name).then(res => {
      setData(res.data?.data || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [name]);

  if (loading) return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Chi tiết nhân viên" backTo="/hr/employees" />
      <PageLoader />
    </div>
  );

  if (name === 'new') return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Thêm nhân viên" backTo="/hr/employees" />
      <div className="card card-body text-center py-12 text-gray-400">
        Mẫu thêm nhân viên mới sẽ được triển khai sau.
      </div>
    </div>
  );

  if (!data) return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Chi tiết nhân viên" backTo="/hr/employees" />
      <div className="card card-body text-center py-12 text-gray-400">
        Không tìm thấy nhân viên.
      </div>
    </div>
  );

  const infoItems = [
    { icon: <Hash size={18} />, label: 'Mã nhân viên', value: data.name },
    { icon: <User size={18} />, label: 'Tên', value: data.employee_name },
    { icon: <Briefcase size={18} />, label: 'Chức danh', value: data.designation },
    { icon: <Building2 size={18} />, label: 'Phòng ban', value: data.department },
    { icon: <Calendar size={18} />, label: 'Ngày vào làm', value: data.date_of_joining },
    { icon: <Building2 size={18} />, label: 'Công ty', value: data.company },
    { icon: <Building2 size={18} />, label: 'Chi nhánh', value: data.branch },
    { icon: <User size={18} />, label: 'Giới tính', value: data.gender },
    { icon: <Calendar size={18} />, label: 'Ngày sinh', value: data.date_of_birth },
    { icon: <User size={18} />, label: 'Email cá nhân', value: data.personal_email },
    { icon: <Hash size={18} />, label: 'Số điện thoại', value: data.cell_number },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={data.employee_name}
        backTo="/hr/employees"
        badge={<StatusBadge status={data.status} />}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {infoItems.map(item => item.value ? (
          <div key={item.label} className="card card-body flex flex-row items-center gap-3">
            <span className="text-gray-400 flex-shrink-0">{item.icon}</span>
            <div>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm font-medium text-gray-800">{item.value}</p>
            </div>
          </div>
        ) : null)}
      </div>
    </div>
  );
}
