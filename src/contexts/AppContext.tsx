import React, { createContext, useContext, useState, useEffect } from 'react';
import { companyApi, warehouseApi } from '../services/api';

interface Company {
  name: string;
  company_name: string;
  default_currency: string;
}

interface Warehouse {
  name: string;
  warehouse_name: string;
  company: string;
}

interface AppContextType {
  companies: Company[];
  warehouses: Warehouse[];
  selectedCompany: string | null;
  selectedWarehouse: string | null;
  setSelectedCompany: (c: string | null) => void;
  setSelectedWarehouse: (w: string | null) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(
    localStorage.getItem('erp_company')
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(
    localStorage.getItem('erp_warehouse')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      companyApi.list({ fields: JSON.stringify(['name', 'company_name', 'default_currency']), limit_page_length: 100 }),
      warehouseApi.list({ fields: JSON.stringify(['name', 'warehouse_name', 'company']), limit_page_length: 100 }),
    ]).then(([compRes, whRes]) => {
      setCompanies(compRes.data?.data || []);
      setWarehouses(whRes.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSetCompany = (c: string | null) => {
    setSelectedCompany(c);
    if (c) localStorage.setItem('erp_company', c);
    else localStorage.removeItem('erp_company');
  };

  const handleSetWarehouse = (w: string | null) => {
    setSelectedWarehouse(w);
    if (w) localStorage.setItem('erp_warehouse', w);
    else localStorage.removeItem('erp_warehouse');
  };

  return (
    <AppContext.Provider value={{
      companies, warehouses,
      selectedCompany, selectedWarehouse,
      setSelectedCompany: handleSetCompany,
      setSelectedWarehouse: handleSetWarehouse,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
