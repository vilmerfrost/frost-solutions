'use client';

import React from 'react';
import {
 LineChart,
 Line,
 BarChart,
 Bar,
 PieChart,
 Pie,
 Cell,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 Legend,
 ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { TrendingUp, Activity, Clock, AlertCircle, BarChart3 } from 'lucide-react';

interface TimelineData {
 date: string;
 success: number;
 error: number;
 total: number;
 avgDuration: number;
 successRate: number;
}

interface BreakdownData {
 operation?: string;
 provider?: string;
 resourceType?: string;
 success: number;
 error: number;
 total: number;
 successRate: number;
}

interface SyncAnalyticsProps {
 timeline: TimelineData[];
 operationBreakdown: BreakdownData[];
 providerBreakdown: BreakdownData[];
 resourceBreakdown: BreakdownData[];
 overall: {
  total: number;
  success: number;
  error: number;
  successRate: number;
  avgDuration: number;
 };
 isLoading?: boolean;
 timeRange?: number;
 onTimeRangeChange?: (days: number) => void;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

export function SyncAnalytics({
 timeline,
 operationBreakdown,
 providerBreakdown,
 resourceBreakdown,
 overall,
 isLoading,
 timeRange = 30,
 onTimeRangeChange,
}: SyncAnalyticsProps) {

 if (isLoading) {
  return (
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-8">
    <div className="animate-pulse space-y-4">
     <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
     {[...Array(3)].map((_, i) => (
      <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
     ))}
    </div>
   </div>
  );
 }

 // Empty state
 if (!timeline || timeline.length === 0) {
  return (
   <Card>
    <CardContent className="p-12 text-center">
     <BarChart3 size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Ingen data ännu
     </h3>
     <p className="text-gray-600 dark:text-gray-400">
      Synkroniseringsdata kommer att visas här när du börjar synkronisera fakturor och kunder.
     </p>
    </CardContent>
   </Card>
  );
 }

 return (
  <div className="space-y-6">
   {/* Overall Metrics */}
   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card className="border-2 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
     <CardContent className="p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
         Totalt synkningar
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
         {overall.total.toLocaleString('sv-SE')}
        </p>
       </div>
       <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <Activity size={24} className="text-blue-600 dark:text-blue-400" />
       </div>
      </div>
     </CardContent>
    </Card>

    <Card className="border-2 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
     <CardContent className="p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
         Framgångsgrad
        </p>
        <p className={`text-3xl font-bold mt-2 ${
         overall.successRate >= 95 
          ? 'text-green-600 dark:text-green-400' 
          : overall.successRate >= 80 
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400'
        }`}>
         {overall.successRate.toFixed(1)}%
        </p>
       </div>
       <div className={`p-3 rounded-lg ${
        overall.successRate >= 95 
         ? 'bg-green-100 dark:bg-green-900/30' 
         : overall.successRate >= 80 
         ? 'bg-yellow-100 dark:bg-yellow-900/30'
         : 'bg-red-100 dark:bg-red-900/30'
       }`}>
        <TrendingUp size={24} className={
         overall.successRate >= 95 
          ? 'text-green-600 dark:text-green-400' 
          : overall.successRate >= 80 
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400'
        } />
       </div>
      </div>
     </CardContent>
    </Card>

    <Card className="border-2 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
     <CardContent className="p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
         Lyckade
        </p>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
         {overall.success.toLocaleString('sv-SE')}
        </p>
       </div>
       <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
        <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
       </div>
      </div>
     </CardContent>
    </Card>

    <Card className="border-2 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
     <CardContent className="p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
         Genomsnittlig tid
        </p>
        <p className="text-3xl font-bold text-primary-500 dark:text-primary-400 mt-2">
         {overall.avgDuration > 1000 
          ? `${(overall.avgDuration / 1000).toFixed(1)}s`
          : `${overall.avgDuration}ms`
         }
        </p>
       </div>
       <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
        <Clock size={24} className="text-primary-500 dark:text-primary-400" />
       </div>
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Timeline Chart */}
   <Card className="border-2 border-gray-200 dark:border-gray-700">
    <CardHeader>
     <div className="flex items-center justify-between">
      <div>
       <CardTitle>Synkronisering över tid</CardTitle>
       <CardDescription>
        Antal synkroniseringar per dag (lyckade vs misslyckade)
       </CardDescription>
      </div>
      {onTimeRangeChange && (
       <Select
        value={timeRange.toString()}
        onChange={(e) => onTimeRangeChange(parseInt(e.target.value, 10))}
        className="w-32"
       >
        <option value="7">7 dagar</option>
        <option value="30">30 dagar</option>
        <option value="90">90 dagar</option>
       </Select>
      )}
     </div>
    </CardHeader>
    <CardContent>
     <ResponsiveContainer width="100%" height={300}>
      <LineChart data={timeline}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis
        dataKey="date"
        tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
       />
       <YAxis />
       <Tooltip
        content={({ active, payload, label }) => {
         if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
           <div className="bg-gray-50 dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">
             {new Date(label).toLocaleDateString('sv-SE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
             })}
            </p>
            <div className="space-y-1 text-sm">
             <p className="text-green-600 dark:text-green-400">
              Lyckade: <span className="font-semibold">{data.success}</span>
             </p>
             <p className="text-red-600 dark:text-red-400">
              Misslyckade: <span className="font-semibold">{data.error}</span>
             </p>
             <p className="text-gray-600 dark:text-gray-400">
              Totalt: <span className="font-semibold">{data.total}</span>
             </p>
             <p className="text-gray-600 dark:text-gray-400">
              Framgångsgrad: <span className="font-semibold">{data.successRate.toFixed(1)}%</span>
             </p>
            </div>
           </div>
          );
         }
         return null;
        }}
       />
       <Legend />
       <Line
        type="monotone"
        dataKey="success"
        stroke="#10b981"
        strokeWidth={2}
        name="Lyckade"
        dot={{ r: 4 }}
       />
       <Line
        type="monotone"
        dataKey="error"
        stroke="#ef4444"
        strokeWidth={2}
        name="Misslyckade"
        dot={{ r: 4 }}
       />
      </LineChart>
     </ResponsiveContainer>
    </CardContent>
   </Card>

   {/* Charts Grid */}
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Success Rate Timeline */}
    <Card className="border-2 border-gray-200 dark:border-gray-700">
     <CardHeader>
      <CardTitle>Framgångsgrad över tid</CardTitle>
      <CardDescription>Procent lyckade synkroniseringar per dag</CardDescription>
     </CardHeader>
     <CardContent>
      <ResponsiveContainer width="100%" height={250}>
       <LineChart data={timeline}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
         dataKey="date"
         tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip
         content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
           const value = payload[0].value as number;
           return (
            <div className="bg-gray-50 dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
             <p className="font-semibold text-gray-900 dark:text-white mb-1">
              {new Date(label).toLocaleDateString('sv-SE')}
             </p>
             <p className="text-blue-600 dark:text-blue-400 font-semibold">
              {value.toFixed(1)}%
             </p>
            </div>
           );
          }
          return null;
         }}
        />
        <Line
         type="monotone"
         dataKey="successRate"
         stroke="#3b82f6"
         strokeWidth={2}
         dot={{ r: 4 }}
        />
       </LineChart>
      </ResponsiveContainer>
     </CardContent>
    </Card>

    {/* Average Duration */}
    <Card className="border-2 border-gray-200 dark:border-gray-700">
     <CardHeader>
      <CardTitle>Genomsnittlig varaktighet</CardTitle>
      <CardDescription>Genomsnittlig synkroniseringstid per dag</CardDescription>
     </CardHeader>
     <CardContent>
      <ResponsiveContainer width="100%" height={250}>
       <BarChart data={timeline}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
         dataKey="date"
         tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
        />
        <YAxis />
        <Tooltip
         content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
           const value = payload[0].value as number;
           return (
            <div className="bg-gray-50 dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
             <p className="font-semibold text-gray-900 dark:text-white mb-1">
              {new Date(label).toLocaleDateString('sv-SE')}
             </p>
             <p className="text-primary-500 dark:text-primary-400 font-semibold">
              {value > 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`}
             </p>
            </div>
           );
          }
          return null;
         }}
        />
        <Bar dataKey="avgDuration" fill="#8b5cf6" />
       </BarChart>
      </ResponsiveContainer>
     </CardContent>
    </Card>

    {/* Operation Breakdown */}
    {operationBreakdown.length > 0 && (
     <Card className="border-2 border-gray-200 dark:border-gray-700">
      <CardHeader>
       <CardTitle>Fördelning per operation</CardTitle>
       <CardDescription>Antal synkroniseringar per operationstyp</CardDescription>
      </CardHeader>
      <CardContent>
       <ResponsiveContainer width="100%" height={250}>
        <BarChart data={operationBreakdown}>
         <CartesianGrid strokeDasharray="3 3" />
         <XAxis dataKey="operation" />
         <YAxis />
         <Tooltip />
         <Legend />
         <Bar dataKey="success" stackId="a" fill="#10b981" name="Lyckade" />
         <Bar dataKey="error" stackId="a" fill="#ef4444" name="Misslyckade" />
        </BarChart>
       </ResponsiveContainer>
      </CardContent>
     </Card>
    )}

    {/* Provider Breakdown */}
    {providerBreakdown.length > 0 && (
     <Card className="border-2 border-gray-200 dark:border-gray-700">
      <CardHeader>
       <CardTitle>Fördelning per provider</CardTitle>
       <CardDescription>Antal synkroniseringar per bokföringssystem</CardDescription>
      </CardHeader>
      <CardContent>
       <ResponsiveContainer width="100%" height={250}>
        <PieChart>
         <Pie
          data={providerBreakdown}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ provider, total }) => `${provider}: ${total}`}
          outerRadius={80}
          fill="#0ea5e9"
          dataKey="total"
         >
          {providerBreakdown.map((entry, index) => (
           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
         </Pie>
         <Tooltip />
        </PieChart>
       </ResponsiveContainer>
      </CardContent>
     </Card>
    )}

    {/* Resource Type Breakdown */}
    {resourceBreakdown.length > 0 && (
     <Card className="border-2 border-gray-200 dark:border-gray-700">
      <CardHeader>
       <CardTitle>Fördelning per resurstyp</CardTitle>
       <CardDescription>Antal synkroniseringar per resurstyp</CardDescription>
      </CardHeader>
      <CardContent>
       <ResponsiveContainer width="100%" height={250}>
        <BarChart data={resourceBreakdown}>
         <CartesianGrid strokeDasharray="3 3" />
         <XAxis dataKey="resourceType" />
         <YAxis />
         <Tooltip />
         <Legend />
         <Bar dataKey="success" fill="#10b981" name="Lyckade" />
         <Bar dataKey="error" fill="#ef4444" name="Misslyckade" />
        </BarChart>
       </ResponsiveContainer>
      </CardContent>
     </Card>
    )}
   </div>
  </div>
 );
}

