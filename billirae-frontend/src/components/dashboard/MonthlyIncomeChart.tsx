import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../services/supabaseClient';
import { logRequestDebugInfo } from '../../utils/logRequest';

interface MonthlyIncomeData {
  month: string;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
  invoice_count: number;
}

interface MonthlyIncomeChartProps {
  useMockData?: boolean;
}

const MONTHS_DE = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
];

const mockData: MonthlyIncomeData[] = [
  { month: '2025-05-01', total_amount: 3200, paid_amount: 3200, unpaid_amount: 0, invoice_count: 4 },
  { month: '2025-04-01', total_amount: 2800, paid_amount: 2800, unpaid_amount: 0, invoice_count: 3 },
  { month: '2025-03-01', total_amount: 4500, paid_amount: 3500, unpaid_amount: 1000, invoice_count: 5 },
  { month: '2025-02-01', total_amount: 1800, paid_amount: 1800, unpaid_amount: 0, invoice_count: 2 },
  { month: '2025-01-01', total_amount: 3000, paid_amount: 3000, unpaid_amount: 0, invoice_count: 3 },
  { month: '2024-12-01', total_amount: 5200, paid_amount: 5200, unpaid_amount: 0, invoice_count: 6 },
  { month: '2024-11-01', total_amount: 2700, paid_amount: 2700, unpaid_amount: 0, invoice_count: 3 },
  { month: '2024-10-01', total_amount: 3800, paid_amount: 3300, unpaid_amount: 500, invoice_count: 4 },
  { month: '2024-09-01', total_amount: 4200, paid_amount: 4200, unpaid_amount: 0, invoice_count: 5 },
  { month: '2024-08-01', total_amount: 2900, paid_amount: 2400, unpaid_amount: 500, invoice_count: 3 },
  { month: '2024-07-01', total_amount: 3600, paid_amount: 3600, unpaid_amount: 0, invoice_count: 4 },
  { month: '2024-06-01', total_amount: 2500, paid_amount: 2500, unpaid_amount: 0, invoice_count: 3 },
];

const formatMonthLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${MONTHS_DE[date.getMonth()]} ${date.getFullYear()}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MonthlyIncomeChart: React.FC<MonthlyIncomeChartProps> = ({ useMockData = false }) => {
  const [data, setData] = useState<MonthlyIncomeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (useMockData) {
        setData(mockData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: monthlyData, error: fetchError } = await supabase
          .rpc('get_monthly_income');

        if (fetchError) {
          throw fetchError;
        }

        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          await logRequestDebugInfo(
            { data: monthlyData, status: 200 },
            'Monthly Income Data',
            { maxBodyLength: 2000 }
          );
        }

        const formattedData = monthlyData.map((item: any) => ({
          month: item.month,
          total_amount: parseFloat(item.total_amount),
          paid_amount: parseFloat(item.paid_amount),
          unpaid_amount: parseFloat(item.unpaid_amount),
          invoice_count: item.invoice_count
        }));

        setData(formattedData);
      } catch (err: any) {
        console.error('Error fetching monthly income data:', err);
        setError('Fehler beim Laden der monatlichen Einnahmen');
        
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [useMockData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-md">
          <p className="font-medium">{formatMonthLabel(label)}</p>
          <p className="text-green-600">
            Bezahlt: {formatCurrency(payload[0].value)}
          </p>
          {payload[1].value > 0 && (
            <p className="text-amber-600">
              Unbezahlt: {formatCurrency(payload[1].value)}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {payload[2].payload.invoice_count} Rechnungen
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>{error}</p>
        <p className="text-sm text-gray-500 mt-2">Zeige Beispieldaten an</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonthLabel}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `${value} €`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="paid_amount" 
            name="Bezahlt" 
            stackId="a" 
            fill="#10b981" 
          />
          <Bar 
            dataKey="unpaid_amount" 
            name="Unbezahlt" 
            stackId="a" 
            fill="#f59e0b" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyIncomeChart;
