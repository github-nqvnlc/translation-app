'use client';

import { Download, FileText, FileSpreadsheet, FileJson, FileCode } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExportMenuProps {
  tableId: string;
  tableName: string;
}

export function ExportMenu({ tableId, tableName }: ExportMenuProps) {
  const exportOptions = [
    { value: 'po', label: 'Xuất .po', icon: FileCode, url: `/api/translation-tables/${tableId}/export/po`, ext: '.po' },
    { value: 'csv', label: 'Xuất CSV', icon: FileText, url: `/api/translation-tables/${tableId}/export/csv`, ext: '.csv' },
    { value: 'excel', label: 'Xuất Excel', icon: FileSpreadsheet, url: `/api/translation-tables/${tableId}/export/excel`, ext: '.xlsx' },
    { value: 'json', label: 'Xuất JSON', icon: FileJson, url: `/api/translation-tables/${tableId}/export/json`, ext: '.json' },
  ];

  const handleExport = (option: typeof exportOptions[0]) => {
    const link = document.createElement('a');
    link.href = option.url;
    link.download = `${tableName}${option.ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Select
      value=""
      onValueChange={(value) => {
        const option = exportOptions.find((opt) => opt.value === value);
        if (option) handleExport(option);
      }}
    >
      <SelectTrigger className="h-9 min-w-[140px] gap-2 bg-white text-slate-900 hover:bg-slate-500">
        <Download className="h-4 w-4" />
        <SelectValue placeholder="Xuất file" />
      </SelectTrigger>
      <SelectContent>
        {exportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

