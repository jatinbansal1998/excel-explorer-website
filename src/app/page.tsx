'use client';

import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { DataTable } from '../components/DataTable';
import { ExcelData } from '../types/excel';
import { useToast } from '../components/ui/Toast';

// Placeholder components for other teams to implement
function FilterPanel() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
      <p className="text-sm text-gray-500">
        Filter panel will be implemented by the Filter team (Plan 04)
      </p>
    </div>
  );
}

function ChartView() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Charts</h3>
      <p className="text-sm text-gray-500">
        Chart visualization will be implemented by the Chart team (Plan 05)
      </p>
    </div>
  );
}

export default function HomePage() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      // This will be implemented by the Data Processing team (Plan 02)
      addToast({
        type: 'info',
        title: 'File Processing',
        message: 'Data processing functionality will be implemented by the Data team',
      });
      
      // Mock data structure for UI development
      const mockData: ExcelData = {
        headers: ['Name', 'Age', 'Email', 'Department', 'Salary', 'Start Date'],
        rows: [
          ['John Doe', 28, 'john@example.com', 'Engineering', 75000, '2020-01-15'],
          ['Jane Smith', 32, 'jane@example.com', 'Marketing', 65000, '2019-03-20'],
          ['Bob Johnson', 45, 'bob@example.com', 'Sales', 80000, '2018-06-10'],
        ],
        metadata: {
          fileName: file.name,
          sheetNames: ['Sheet1'],
          activeSheet: 'Sheet1',
          totalRows: 3,
          totalColumns: 6,
          fileSize: file.size,
          columns: [
            { name: 'Name', index: 0, type: 'string', uniqueValues: [], uniqueCount: 3, hasNulls: false, nullCount: 0, sampleValues: ['John Doe', 'Jane Smith', 'Bob Johnson'] },
            { name: 'Age', index: 1, type: 'number', uniqueValues: [], uniqueCount: 3, hasNulls: false, nullCount: 0, sampleValues: [28, 32, 45] },
            { name: 'Email', index: 2, type: 'string', uniqueValues: [], uniqueCount: 3, hasNulls: false, nullCount: 0, sampleValues: ['john@example.com', 'jane@example.com', 'bob@example.com'] },
            { name: 'Department', index: 3, type: 'string', uniqueValues: [], uniqueCount: 3, hasNulls: false, nullCount: 0, sampleValues: ['Engineering', 'Marketing', 'Sales'] },
            { name: 'Salary', index: 4, type: 'number', uniqueValues: [], uniqueCount: 3, hasNulls: false, nullCount: 0, sampleValues: [75000, 65000, 80000] },
            { name: 'Start Date', index: 5, type: 'date', uniqueValues: [], uniqueCount: 3, hasNulls: false, nullCount: 0, sampleValues: ['2020-01-15', '2019-03-20', '2018-06-10'] },
          ],
        },
      };

      // Simulate processing delay
      setTimeout(() => {
        setExcelData(mockData);
        setIsLoading(false);
        addToast({
          type: 'success',
          title: 'File Uploaded Successfully',
          message: `${file.name} has been processed (mock data shown)`,
        });
      }, 2000);

    } catch (error) {
      setIsLoading(false);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'There was an error processing your file',
      });
    }
  };

  return (
    <div className="space-y-6">
      <FileUploader 
        onFileSelect={handleFileSelect}
        isLoading={isLoading}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <DataTable 
            data={excelData}
            isLoading={isLoading}
          />
          <ChartView />
        </div>
      </div>
    </div>
  );
}
