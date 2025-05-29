import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { logRequestDebugInfo } from '../../utils/logRequest';

interface YearlyIncomeData {
  year: string;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
  invoice_count: number;
}

interface YearlySummaryCardProps {
  useMockData?: boolean;
}

const mockData: YearlyIncomeData[] = [
  { year: '2025-01-01', total_amount: 15300, paid_amount: 14300, unpaid_amount: 1000, invoice_count: 17 },
  { year: '2024-01-01', total_amount: 38600, paid_amount: 37600, unpaid_amount: 1000, invoice_count: 42 },
  { year: '2023-01-01', total_amount: 32400, paid_amount: 32400, unpaid_amount: 0, invoice_count: 36 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const YearlySummaryCard: React.FC<YearlySummaryCardProps> = ({ useMockData = false }) => {
  const [data, setData] = useState<YearlyIncomeData[]>([]);
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

        const { data: yearlyData, error: fetchError } = await supabase
          .rpc('get_yearly_income');

        if (fetchError) {
          throw fetchError;
        }

        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          await logRequestDebugInfo(
            { data: yearlyData, status: 200 },
            'Yearly Income Data',
            { maxBodyLength: 2000 }
          );
        }

        const formattedData = yearlyData.map((item: any) => ({
          year: item.year,
          total_amount: parseFloat(item.total_amount),
          paid_amount: parseFloat(item.paid_amount),
          unpaid_amount: parseFloat(item.unpaid_amount),
          invoice_count: item.invoice_count
        }));

        setData(formattedData);
      } catch (err: any) {
        console.error('Error fetching yearly income data:', err);
        setError('Fehler beim Laden der jährlichen Einnahmen');
        
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [useMockData]);

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

  const sortedData = [...data].sort((a, b) => 
    new Date(b.year).getTime() - new Date(a.year).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedData.map((yearData) => {
        const year = new Date(yearData.year).getFullYear();
        const percentPaid = yearData.total_amount > 0 
          ? Math.round((yearData.paid_amount / yearData.total_amount) * 100) 
          : 100;
        
        return (
          <div key={year} className="border rounded-lg p-4 bg-card">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">{year}</h3>
              <span className="text-sm text-muted-foreground">
                {yearData.invoice_count} Rechnungen
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(yearData.total_amount)}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Bezahlt</p>
                <p className="text-2xl font-semibold text-green-600">
                  {formatCurrency(yearData.paid_amount)}
                </p>
              </div>
            </div>
            
            {yearData.unpaid_amount > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Zahlungsstatus</span>
                  <span>{percentPaid}% bezahlt</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${percentPaid}%` }}
                  ></div>
                </div>
                <p className="text-sm text-amber-600 mt-2">
                  Ausstehend: {formatCurrency(yearData.unpaid_amount)}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default YearlySummaryCard;
