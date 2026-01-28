// app/components/payroll/PeriodForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, AlertTriangle, ChevronDown, ChevronUp, Users, FileText, DollarSign } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { BASE_PATH } from '@/utils/url';

const periodSchema = z.object({
 startDate: z.string().min(1, 'Startdatum är obligatoriskt'),
 endDate: z.string().min(1, 'Slutdatum är obligatoriskt'),
 format: z.enum(['fortnox-paxml', 'visma-csv', 'bank-format', 'other']),
 periodType: z.enum(['month', 'week', 'biweek']),
}).refine((data) => {
 const start = new Date(data.startDate);
 const end = new Date(data.endDate);
 return start < end;
}, {
 message: 'Startdatum måste vara före slutdatum',
 path: ['endDate'],
});

type PeriodFormData = z.infer<typeof periodSchema>;

interface Employee {
 id: string;
 name: string;
 full_name?: string;
 employment_type?: string;
 monthly_salary_gross?: number;
 base_rate_sek?: number;
}

interface EmployeeHours {
 employeeId: string;
 totalHours: number;
 regularHours: number;
 overtimeHours: number;
 grossPay: number;
}

interface PeriodFormProps {
 onSubmit: (data: any) => void;
 isLoading: boolean;
}

export function PeriodForm({ onSubmit, isLoading }: PeriodFormProps) {
 const { tenantId } = useTenant();
 const [employees, setEmployees] = useState<Employee[]>([]);
 const [employeeHours, setEmployeeHours] = useState<Map<string, EmployeeHours>>(new Map());
 const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
 const [loadingEmployees, setLoadingEmployees] = useState(false);
 const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

 // Filter states
 const [filterFullTime, setFilterFullTime] = useState(true);
 const [filterPartTime, setFilterPartTime] = useState(true);
 const [filterTemporary, setFilterTemporary] = useState(true);

 // Calculation inclusion states
 const [includeBasePay, setIncludeBasePay] = useState(true);
 const [includeVacationPay, setIncludeVacationPay] = useState(true);
 const [includeSickPay, setIncludeSickPay] = useState(true);
 const [includeTaxDeduction, setIncludeTaxDeduction] = useState(true);
 const [includeUnionFee, setIncludeUnionFee] = useState(true);
 const [includeBonus, setIncludeBonus] = useState(false);

 // Dispatch options
 const [sendPdfToEmployees, setSendPdfToEmployees] = useState(true);
 const [saveInternally, setSaveInternally] = useState(true);

 const {
  register,
  handleSubmit,
  watch,
  setValue,
  formState: { errors },
 } = useForm<PeriodFormData>({
  resolver: zodResolver(periodSchema),
  defaultValues: {
   startDate: '',
   endDate: '',
   format: 'fortnox-paxml',
   periodType: 'month',
  },
 });

 const startDate = watch('startDate');
 const endDate = watch('endDate');
 const periodType = watch('periodType');

 // Auto-set dates based on period type
 useEffect(() => {
  if (!periodType) return;
  
  const today = new Date();
  let start: Date;
  let end: Date;

  switch (periodType) {
   case 'month':
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    break;
   case 'week':
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start = new Date(today.setDate(diff));
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    break;
   case 'biweek':
    const biweekDay = today.getDay();
    const biweekDiff = today.getDate() - biweekDay + (biweekDay === 0 ? -6 : 1);
    start = new Date(today.setDate(biweekDiff));
    end = new Date(start);
    end.setDate(start.getDate() + 13);
    break;
  }

  setValue('startDate', start.toISOString().split('T')[0]);
  setValue('endDate', end.toISOString().split('T')[0]);
 }, [periodType, setValue]);

 // Fetch employees when tenant is ready
 useEffect(() => {
  if (!tenantId) return;

  async function fetchEmployees() {
   setLoadingEmployees(true);
   try {
    const res = await fetch(`${BASE_PATH}/api/employees/list?tenantId=${tenantId}`, { cache: 'no-store' });
    if (res.ok) {
     const data = await res.json();
     const employeeList = (data.employees || []).filter((e: any) => !e.is_archived);
     setEmployees(employeeList);
     // Select all employees by default
     setSelectedEmployees(new Set(employeeList.map((e: Employee) => e.id)));
    }
   } catch (err) {
    console.error('Error fetching employees:', err);
   } finally {
    setLoadingEmployees(false);
   }
  }
  fetchEmployees();
 }, [tenantId]);

 // Fetch time entries for selected period
 useEffect(() => {
  if (!tenantId || !startDate || !endDate) return;

  async function fetchTimeEntries() {
   try {
    const res = await fetch(
     `${BASE_PATH}/api/time-entries/list?tenantId=${tenantId}&startDate=${startDate}&endDate=${endDate}`,
     { cache: 'no-store' }
    );
    if (res.ok) {
     const data = await res.json();
     const entries = data.timeEntries || [];
     
     // Aggregate hours per employee
     const hoursMap = new Map<string, EmployeeHours>();
     
     entries.forEach((entry: any) => {
      const empId = entry.employee_id;
      const hours = entry.hours_total || 0;
      const amount = entry.amount_total || 0;
      
      if (!hoursMap.has(empId)) {
       hoursMap.set(empId, {
        employeeId: empId,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        grossPay: 0,
       });
      }
      
      const current = hoursMap.get(empId)!;
      current.totalHours += hours;
      current.grossPay += amount;
      
      // Consider >40h/week as overtime (simplified)
      if (current.totalHours > 160) {
       current.overtimeHours = current.totalHours - 160;
       current.regularHours = 160;
      } else {
       current.regularHours = current.totalHours;
      }
     });
     
     setEmployeeHours(hoursMap);
    }
   } catch (err) {
    console.error('Error fetching time entries:', err);
   }
  }
  fetchTimeEntries();
 }, [tenantId, startDate, endDate]);

 // Filter employees based on employment type
 const filteredEmployees = employees.filter(emp => {
  const type = emp.employment_type?.toUpperCase() || 'FULL_TIME';
  if (type === 'FULL_TIME' && !filterFullTime) return false;
  if (type === 'PART_TIME' && !filterPartTime) return false;
  if ((type === 'TEMPORARY' || type === 'CONTRACTOR') && !filterTemporary) return false;
  return true;
 });

 // Calculate totals
 const totalSelectedHours = Array.from(selectedEmployees).reduce((sum, empId) => {
  return sum + (employeeHours.get(empId)?.totalHours || 0);
 }, 0);

 const totalGrossPay = Array.from(selectedEmployees).reduce((sum, empId) => {
  return sum + (employeeHours.get(empId)?.grossPay || 0);
 }, 0);

 // Calculate net pay estimate (simplified)
 const calculateNetPay = (gross: number): number => {
  let net = gross;
  if (includeVacationPay) net += gross * 0.12; // 12% vacation pay
  if (includeSickPay) net += gross * 0.01; // Estimated sick pay addition
  if (includeTaxDeduction) net -= gross * 0.30; // ~30% tax
  if (includeUnionFee) net -= gross * 0.015; // ~1.5% union fee
  return Math.max(0, net);
 };

 const daysDiff = startDate && endDate
  ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  : 0;

 const showWarning = daysDiff > 31;

 const handleFormSubmit = (data: PeriodFormData) => {
  onSubmit({
   ...data,
   selectedEmployeeIds: Array.from(selectedEmployees),
   calculations: {
    includeBasePay,
    includeVacationPay,
    includeSickPay,
    includeTaxDeduction,
    includeUnionFee,
    includeBonus,
   },
   dispatch: {
    sendPdfToEmployees,
    saveInternally,
   },
  });
 };

 const toggleEmployee = (empId: string) => {
  setSelectedEmployees(prev => {
   const next = new Set(prev);
   if (next.has(empId)) {
    next.delete(empId);
   } else {
    next.add(empId);
   }
   return next;
  });
 };

 const toggleAllEmployees = () => {
  if (selectedEmployees.size === filteredEmployees.length) {
   setSelectedEmployees(new Set());
  } else {
   setSelectedEmployees(new Set(filteredEmployees.map(e => e.id)));
  }
 };

 const formatHours = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
 };

 return (
  <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
   {/* Period Info */}
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
     <FileText className="w-5 h-5 text-primary-500" />
     Period Information
    </h2>

    <div className="mb-4">
     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Löneperiod *
     </label>
     <div className="flex gap-2">
      {[
       { value: 'month', label: 'Månad' },
       { value: 'week', label: 'Vecka' },
       { value: 'biweek', label: 'Tvåvecka' },
      ].map((opt) => (
       <button
        key={opt.value}
        type="button"
        onClick={() => setValue('periodType', opt.value as any)}
        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
         periodType === opt.value
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
       >
        {opt.label}
       </button>
      ))}
     </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <Input
      label="Period från *"
      type="date"
      {...register('startDate')}
      error={errors.startDate?.message}
     />

     <Input
      label="Period till *"
      type="date"
      {...register('endDate')}
      error={errors.endDate?.message}
     />
    </div>

    {daysDiff > 0 && (
     <div className={`mt-4 p-3 rounded-lg ${showWarning ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
      <p className={`text-sm ${showWarning ? 'text-yellow-800 dark:text-yellow-300' : 'text-green-800 dark:text-green-300'}`}>
       Perioden täcker: <strong>{daysDiff} dagar</strong>
       {showWarning && (
        <span className="flex items-center gap-1 mt-1">
         <AlertTriangle className="w-4 h-4" />
         Perioder längre än 31 dagar rekommenderas inte
        </span>
       )}
      </p>
     </div>
    )}
   </div>

   {/* Employee Selection */}
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
     <Users className="w-5 h-5 text-primary-500" />
     Medarbetare & Status
    </h2>

    {/* Filters */}
    <div className="mb-4">
     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Visa endast:
     </label>
     <div className="flex gap-4 flex-wrap">
      <label className="flex items-center gap-2 cursor-pointer">
       <input
        type="checkbox"
        checked={filterFullTime}
        onChange={(e) => setFilterFullTime(e.target.checked)}
        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
       />
       <span className="text-sm text-gray-700 dark:text-gray-300">Fast anställda</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
       <input
        type="checkbox"
        checked={filterPartTime}
        onChange={(e) => setFilterPartTime(e.target.checked)}
        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
       />
       <span className="text-sm text-gray-700 dark:text-gray-300">Deltid</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
       <input
        type="checkbox"
        checked={filterTemporary}
        onChange={(e) => setFilterTemporary(e.target.checked)}
        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
       />
       <span className="text-sm text-gray-700 dark:text-gray-300">Vikarier</span>
      </label>
     </div>
    </div>

    {/* Employee List */}
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
     <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 flex items-center justify-between">
      <label className="flex items-center gap-2 cursor-pointer">
       <input
        type="checkbox"
        checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
        onChange={toggleAllEmployees}
        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
       />
       <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Välj alla ({filteredEmployees.length})
       </span>
      </label>
      <span className="text-sm text-gray-500">
       {selectedEmployees.size} valda
      </span>
     </div>

     <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
      {loadingEmployees ? (
       <div className="px-4 py-3 text-center text-gray-500">Laddar medarbetare...</div>
      ) : filteredEmployees.length === 0 ? (
       <div className="px-4 py-3 text-center text-gray-500">Inga medarbetare hittades</div>
      ) : (
       filteredEmployees.map((emp) => {
        const hours = employeeHours.get(emp.id);
        return (
         <div key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
          <div className="px-4 py-3 flex items-center justify-between">
           <label className="flex items-center gap-3 cursor-pointer flex-1">
            <input
             type="checkbox"
             checked={selectedEmployees.has(emp.id)}
             onChange={() => toggleEmployee(emp.id)}
             className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="font-medium text-gray-900 dark:text-white">
             {emp.full_name || emp.name}
            </span>
           </label>
           <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
             {hours ? formatHours(hours.totalHours) : '0h 0m'}
            </span>
            <button
             type="button"
             onClick={() => setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
             className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
             {expandedEmployee === emp.id ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
             ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
             )}
            </button>
           </div>
          </div>
          
          {/* Expanded Details */}
          {expandedEmployee === emp.id && hours && (
           <div className="px-4 pb-3 ml-7 text-sm space-y-1 bg-gray-50 dark:bg-gray-700/20">
            <div className="flex justify-between">
             <span className="text-gray-600 dark:text-gray-400">Bruttolön:</span>
             <span className="font-medium">{hours.grossPay.toLocaleString('sv-SE')} kr</span>
            </div>
            <div className="flex justify-between">
             <span className="text-gray-600 dark:text-gray-400">Semesterersättning (12%):</span>
             <span className="font-medium">{(hours.grossPay * 0.12).toLocaleString('sv-SE')} kr</span>
            </div>
            <div className="flex justify-between">
             <span className="text-gray-600 dark:text-gray-400">Skatt (~30%):</span>
             <span className="font-medium text-red-600">-{(hours.grossPay * 0.30).toLocaleString('sv-SE')} kr</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
             <span className="text-gray-700 dark:text-gray-300 font-medium">Nettolön (uppskattad):</span>
             <span className="font-bold text-green-600 dark:text-green-400">
              {calculateNetPay(hours.grossPay).toLocaleString('sv-SE')} kr
             </span>
            </div>
           </div>
          )}
         </div>
        );
       })
      )}
     </div>
    </div>
   </div>

   {/* Calculation Options */}
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
     <DollarSign className="w-5 h-5 text-primary-500" />
     Beräkning & Avdrag
    </h2>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
     {[
      { key: 'includeBasePay', label: 'Baslön & timlöner', state: includeBasePay, setter: setIncludeBasePay },
      { key: 'includeVacationPay', label: 'Semesterersättning', state: includeVacationPay, setter: setIncludeVacationPay },
      { key: 'includeSickPay', label: 'Sjuklöneersättning', state: includeSickPay, setter: setIncludeSickPay },
      { key: 'includeTaxDeduction', label: 'Skatteavdrag (prel.)', state: includeTaxDeduction, setter: setIncludeTaxDeduction },
      { key: 'includeUnionFee', label: 'Fackavgift', state: includeUnionFee, setter: setIncludeUnionFee },
      { key: 'includeBonus', label: 'Bonus/Tillägg', state: includeBonus, setter: setIncludeBonus },
     ].map((opt) => (
      <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
       <input
        type="checkbox"
        checked={opt.state}
        onChange={(e) => opt.setter(e.target.checked)}
        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
       />
       <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
      </label>
     ))}
    </div>
   </div>

   {/* Export Options */}
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
     Export & Utskick
    </h2>

    <div className="mb-4">
     <Select
      label="Exportformat *"
      {...register('format')}
      error={errors.format?.message}
     >
      <option value="fortnox-paxml">Fortnox (PAXml/CSV)</option>
      <option value="visma-csv">Visma eAccounting</option>
      <option value="bank-format">Bankformat</option>
      <option value="other">Annat löneprogram</option>
     </Select>
    </div>

    <div className="space-y-3">
     <label className="flex items-center gap-2 cursor-pointer">
      <input
       type="checkbox"
       checked={sendPdfToEmployees}
       onChange={(e) => setSendPdfToEmployees(e.target.checked)}
       className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">
       Skicka PDF till alla medarbetare
      </span>
     </label>
     <label className="flex items-center gap-2 cursor-pointer">
      <input
       type="checkbox"
       checked={saveInternally}
       onChange={(e) => setSaveInternally(e.target.checked)}
       className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">
       Spara löneunderlag internt
      </span>
     </label>
    </div>
   </div>

   {/* Summary */}
   {selectedEmployees.size > 0 && totalSelectedHours > 0 && (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
     <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
      Sammanfattning
     </h3>
     <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
       <span className="text-gray-600 dark:text-gray-400">Antal medarbetare:</span>
       <span className="ml-2 font-semibold">{selectedEmployees.size}</span>
      </div>
      <div>
       <span className="text-gray-600 dark:text-gray-400">Totalt timmar:</span>
       <span className="ml-2 font-semibold">{formatHours(totalSelectedHours)}</span>
      </div>
      <div>
       <span className="text-gray-600 dark:text-gray-400">Total bruttolön:</span>
       <span className="ml-2 font-semibold">{totalGrossPay.toLocaleString('sv-SE')} kr</span>
      </div>
      <div>
       <span className="text-gray-600 dark:text-gray-400">Total nettolön (uppskattad):</span>
       <span className="ml-2 font-semibold text-green-700 dark:text-green-400">
        {calculateNetPay(totalGrossPay).toLocaleString('sv-SE')} kr
       </span>
      </div>
     </div>
    </div>
   )}

   {/* Submit */}
   <div className="flex items-center justify-end gap-3">
    <Button
     type="submit"
     disabled={isLoading || selectedEmployees.size === 0}
     size="lg"
     className="bg-primary-500 hover:bg-primary-600"
    >
     <Save className="w-4 h-4 mr-2" />
     {isLoading ? 'Skapar...' : 'Skapa period & Exportera'}
    </Button>
   </div>
  </form>
 );
}
