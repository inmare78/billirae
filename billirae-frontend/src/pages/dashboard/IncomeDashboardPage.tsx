import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import DashboardCard from '../../components/dashboard/DashboardCard';
import MonthlyIncomeChart from '../../components/dashboard/MonthlyIncomeChart';
import YearlySummaryCard from '../../components/dashboard/YearlySummaryCard';
import { logPageDebugInfo } from '../../utils/logPage';

const IncomeDashboardPage: React.FC = () => {
  const [useMockData, setUseMockData] = useState<boolean>(
    localStorage.getItem('test_mode') === 'true'
  );

  React.useEffect(() => {
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      logPageDebugInfo(
        window as any, 
        'Income Dashboard Page Loaded', 
        { takeScreenshot: true }
      );
    }
  }, []);

  const handleTabChange = (value: string) => {
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      logPageDebugInfo(
        window as any, 
        `Tab changed to ${value}`, 
        { takeScreenshot: true }
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Einnahmen-Dashboard</h1>
          <p className="text-muted-foreground">
            Übersicht Ihrer monatlichen und jährlichen Einnahmen
          </p>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 md:mt-0">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Beispieldaten verwenden</span>
            </label>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="monthly" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="monthly">Monatliche Übersicht</TabsTrigger>
          <TabsTrigger value="yearly">Jährliche Übersicht</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="space-y-6">
          <DashboardCard
            title="Monatliche Einnahmen"
            description="Einnahmen der letzten 12 Monate"
          >
            <MonthlyIncomeChart useMockData={useMockData} />
          </DashboardCard>
        </TabsContent>
        
        <TabsContent value="yearly" className="space-y-6">
          <DashboardCard
            title="Jährliche Einnahmen"
            description="Gesamteinnahmen nach Jahren"
          >
            <YearlySummaryCard useMockData={useMockData} />
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomeDashboardPage;
