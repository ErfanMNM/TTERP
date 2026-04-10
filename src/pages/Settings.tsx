import React from 'react';
import PageHeader from '../components/PageHeader';
import { useApp } from '../contexts/AppContext';

export default function SettingsPage() {
  const { selectedCompany, selectedWarehouse, setSelectedCompany, setSelectedWarehouse, companies, warehouses } = useApp();
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Thiết lập" backTo="/dashboard" />
      <div className="flex flex-col gap-4">
        <div className="card card-body">
          <h2 className="text-base font-semibold mb-4">Công ty mặc định</h2>
          <select className="select-field" value={selectedCompany || ''} onChange={e => setSelectedCompany(e.target.value || null)}>
            <option value="">— Chọn công ty —</option>
            {companies.map(c => <option key={c.name} value={c.name}>{c.company_name}</option>)}
          </select>
        </div>
        <div className="card card-body">
          <h2 className="text-base font-semibold mb-4">Kho mặc định</h2>
          <select className="select-field" value={selectedWarehouse || ''} onChange={e => setSelectedWarehouse(e.target.value || null)}>
            <option value="">— Chọn kho —</option>
            {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}