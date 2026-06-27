//web/src/app/dashboard/reports/page.tsx

'use client';

import { motion } from 'framer-motion';
import { Download, TrendingUp, Clock, MapPin, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import { useState, useEffect, useMemo } from 'react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface DailyData {
  date: string;
  total_count: number;
  avg_count: number;
  peak_count: number;
  peak_time: string;
  avg_density: string;
  hourly_data: { hour: number; count: number }[];
}

interface AlertSummary {
  name: string;
  value: number;
  color: string;
}

interface PeakData {
  time: string;
  count: number;
}

interface ZoneRanking {
  zone: string;
  avg_density: number;
  peak_count: number;
  alerts: number;
}

interface AlertLog {
  date: string;
  type: string;
  level: string;
  time: string;
  zone: string;
}

interface ReportData {
  success: boolean;
  daily_data: DailyData[];
  alert_summary: AlertSummary[];
  peak_data: PeakData[];
  zone_rankings: ZoneRanking[];
  alert_log: AlertLog[];
  date_range: { start: string; end: string };
  total_people: number;
  peak_count: number;
  peak_time: string;
  total_alerts: number;
  busiest_zone: string;
}

type TimeRange = '1day' | '7days' | '30days';

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');

  const fetchReportData = async (range: TimeRange, date?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/reports';
      
      if (date) {
        url += `?date=${date}`;
      } else {
        let days = 7;
        if (range === '1day') days = 1;
        if (range === '7days') days = 7;
        if (range === '30days') days = 30;
        url += `?days=${days}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data);
      } else {
        setError(data.error || 'Failed to load report data');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(timeRange, selectedDate);
  }, [timeRange, selectedDate]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setSelectedDate('');
  };

  const handlePreviousDay = () => {
    if (reportData?.daily_data && reportData.daily_data.length > 0) {
      const currentIndex = reportData.daily_data.findIndex(d => d.date === selectedDate);
      if (currentIndex > 0) {
        setSelectedDate(reportData.daily_data[currentIndex - 1].date);
      } else if (currentIndex === -1 && reportData.daily_data.length > 0) {
        setSelectedDate(reportData.daily_data[0].date);
      }
    }
  };

  const handleNextDay = () => {
    if (reportData?.daily_data && reportData.daily_data.length > 0) {
      const currentIndex = reportData.daily_data.findIndex(d => d.date === selectedDate);
      if (currentIndex < reportData.daily_data.length - 1) {
        setSelectedDate(reportData.daily_data[currentIndex + 1].date);
      }
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    
    const csvData = reportData.daily_data.flatMap(day => 
      day.hourly_data.map(hour => ({
        Date: day.date,
        Hour: `${hour.hour}:00`,
        Count: hour.count,
        PeakCount: day.peak_count,
        PeakTime: day.peak_time,
        Density: day.avg_density
      }))
    );
    
    if (csvData.length === 0) return;
    
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crowd_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = useMemo(() => {
    if (!reportData) return [];
    
    if (selectedDate) {
      const dayData = reportData.daily_data.find(d => d.date === selectedDate);
      if (dayData && dayData.hourly_data.length > 0) {
        return dayData.hourly_data.map(hour => ({
          time: `${hour.hour}:00`,
          count: hour.count,
          label: `${hour.hour}:00`
        }));
      }
      return [];
    }
    
    if (timeRange === '1day' && reportData.daily_data.length > 0) {
      const latestDay = reportData.daily_data[reportData.daily_data.length - 1];
      if (latestDay && latestDay.hourly_data.length > 0) {
        return latestDay.hourly_data.map(hour => ({
          time: `${hour.hour}:00`,
          count: hour.count,
          label: `${hour.hour}:00`
        }));
      }
    }
    
    return reportData.daily_data.map(day => ({
      time: day.date,
      count: day.total_count,
      label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [reportData, selectedDate, timeRange]);

  const getChartTitle = () => {
    if (selectedDate) {
      return `Crowd Count - ${selectedDate}`;
    }
    switch (timeRange) {
      case '1day':
        return 'Crowd Count - Last 24 Hours';
      case '7days':
        return 'Crowd Count - Last 7 Days';
      case '30days':
        return 'Crowd Count - Last 30 Days';
      default:
        return 'Crowd Count Over Time';
    }
  };

  const getXAxisLabel = () => {
    if (selectedDate || timeRange === '1day') {
      return 'Hour of Day';
    }
    return 'Date';
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-white/40">No data available for this period</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis 
              dataKey="label" 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} 
              axisLine={false} 
              tickLine={false}
              interval={timeRange === '30days' ? 2 : 0}
            />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: 'rgba(5,13,20,0.9)', border: '1px solid rgba(122,178,178,0.2)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
              formatter={(value) => [`${value} people`, 'Count']}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="count" fill="#7AB2B2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis 
              dataKey="label" 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} 
              axisLine={false} 
              tickLine={false}
              interval={timeRange === '30days' ? 2 : 0}
            />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: 'rgba(5,13,20,0.9)', border: '1px solid rgba(122,178,178,0.2)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
              formatter={(value) => [`${value} people`, 'Count']}
              labelFormatter={(label) => label}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#7AB2B2" 
              strokeWidth={2} 
              dot={{ fill: '#7AB2B2', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7AB2B2" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#7AB2B2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis 
            dataKey="label" 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} 
            axisLine={false} 
            tickLine={false}
            interval={timeRange === '30days' ? 2 : 0}
          />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ background: 'rgba(5,13,20,0.9)', border: '1px solid rgba(122,178,178,0.2)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
            formatter={(value) => [`${value} people`, 'Count']}
            labelFormatter={(label) => label}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#7AB2B2" 
            strokeWidth={2} 
            fill="url(#reportGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
            <p className="text-sm text-white/40 mt-1">Loading report data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <GlassCard key={i} className="h-24 animate-pulse">
              <div className="bg-white/10 rounded-lg h-full" />
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <GlassCard className="text-center py-12">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-red-400 mb-2">{error || 'No data available'}</p>
          <p className="text-sm text-white/40">Make sure the backend server is running and cameras are configured</p>
        </GlassCard>
      </div>
    );
  }

  // Get actual data for the selected view
  const getActualStats = () => {
    if (selectedDate) {
      const dayData = reportData.daily_data.find(d => d.date === selectedDate);
      if (dayData) {
        return {
          total: dayData.total_count,
          peak: dayData.peak_count,
          peakTime: dayData.peak_time,
          density: dayData.avg_density
        };
      }
    }
    
    if (timeRange === '1day' && reportData.daily_data.length > 0) {
      const latestDay = reportData.daily_data[reportData.daily_data.length - 1];
      return {
        total: latestDay.total_count,
        peak: latestDay.peak_count,
        peakTime: latestDay.peak_time,
        density: latestDay.avg_density
      };
    }
    
    if (timeRange === '7days') {
      const totalPeople = reportData.daily_data.reduce((sum, day) => sum + day.total_count, 0);
      const maxPeak = Math.max(...reportData.daily_data.map(day => day.peak_count), 0);
      const peakTimeDay = reportData.daily_data.find(day => day.peak_count === maxPeak);
      return {
        total: totalPeople,
        peak: maxPeak,
        peakTime: peakTimeDay ? peakTimeDay.peak_time : 'N/A',
        density: reportData.daily_data.length > 0 ? reportData.daily_data[0].avg_density : 'Low'
      };
    }
    
    if (timeRange === '30days') {
      const totalPeople = reportData.daily_data.reduce((sum, day) => sum + day.total_count, 0);
      const maxPeak = Math.max(...reportData.daily_data.map(day => day.peak_count), 0);
      const peakTimeDay = reportData.daily_data.find(day => day.peak_count === maxPeak);
      return {
        total: totalPeople,
        peak: maxPeak,
        peakTime: peakTimeDay ? peakTimeDay.peak_time : 'N/A',
        density: reportData.daily_data.length > 0 ? reportData.daily_data[0].avg_density : 'Low'
      };
    }
    
    return {
      total: reportData.total_people,
      peak: reportData.peak_count,
      peakTime: reportData.peak_time,
      density: reportData.daily_data.length > 0 ? reportData.daily_data[0].avg_density : 'Low'
    };
  };

  const actualStats = getActualStats();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-white/40 mt-1">Comprehensive crowd analytics and incident reports</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => handleTimeRangeChange('1day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === '1day' && !selectedDate ? 'bg-primary-light text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              1 Day
            </button>
            <button
              onClick={() => handleTimeRangeChange('7days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === '7days' && !selectedDate ? 'bg-primary-light text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => handleTimeRangeChange('30days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === '30days' && !selectedDate ? 'bg-primary-light text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              30 Days
            </button>
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                chartType === 'area' ? 'bg-primary-light text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                chartType === 'line' ? 'bg-primary-light text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                chartType === 'bar' ? 'bg-primary-light text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Bar
            </button>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-light/15 hover:bg-primary-light/25 text-accent text-sm font-medium transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      {selectedDate && reportData.daily_data.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <button
            onClick={handlePreviousDay}
            disabled={reportData.daily_data.findIndex(d => d.date === selectedDate) === 0}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} className="text-white/60" />
          </button>
          <div className="text-center">
            <p className="text-sm text-white/40">Selected Date</p>
            <p className="text-lg font-bold text-white">{selectedDate}</p>
          </div>
          <button
            onClick={handleNextDay}
            disabled={reportData.daily_data.findIndex(d => d.date === selectedDate) === reportData.daily_data.length - 1}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} className="text-white/60" />
          </button>
        </div>
      )}

      {/* Summary Stats Cards - Fixed layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/15 flex-shrink-0">
              <TrendingUp size={20} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1">Total People</p>
              <p className="text-2xl font-bold text-white truncate">{actualStats.total.toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/15 flex-shrink-0">
              <Clock size={20} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1">Peak Time</p>
              <p className="text-lg font-bold text-white truncate">{actualStats.peakTime}</p>
              <p className="text-xs text-white/40">{actualStats.peak} people</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/15 flex-shrink-0">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1">Total Alerts</p>
              <p className="text-2xl font-bold text-red-400 truncate">{reportData.total_alerts}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/15 flex-shrink-0">
              <MapPin size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1">Busiest Zone</p>
              <p className="text-base font-bold text-white truncate" title={reportData.busiest_zone}>
                {reportData.busiest_zone}
              </p>
              <p className="text-xs text-white/40">{actualStats.density} density</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Chart */}
      <GlassCard hover={false}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-white">{getChartTitle()}</h3>
          <p className="text-xs text-white/40">{getXAxisLabel()}</p>
        </div>
        <div className="h-80 w-full">
          {renderChart()}
        </div>
      </GlassCard>

      {/* Charts row - Alert Breakdown and Zone Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert breakdown */}
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold text-white mb-4">Alert Breakdown</h3>
          <div className="h-64">
            {reportData.alert_summary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={reportData.alert_summary} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={4}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {reportData.alert_summary.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} opacity={0.8} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'rgba(5,13,20,0.9)', border: '1px solid rgba(122,178,178,0.2)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/40 text-sm">No alerts in selected period</p>
              </div>
            )}
          </div>
          <div className="space-y-2 mt-4">
            {reportData.alert_summary.map(a => (
              <div key={a.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                  <span className="text-xs text-white/50">{a.name.charAt(0).toUpperCase() + a.name.slice(1)}</span>
                </div>
                <span className="text-xs font-bold text-white">{a.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Zone ranking */}
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold text-white mb-4">Crowded Zones Ranking</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-white/30 uppercase tracking-wider border-b border-white/[0.04]">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Zone</th>
                  <th className="pb-3 pr-4">Avg Density</th>
                  <th className="pb-3 pr-4">Peak</th>
                  <th className="pb-3">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {reportData.zone_rankings.map((z, i) => (
                  <tr key={z.zone} className="border-b border-white/[0.02]">
                    <td className="py-3 pr-4 text-sm font-bold text-white/40">{i + 1}</td>
                    <td className="py-3 pr-4 text-sm font-medium text-white/80">{z.zone}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={z.avg_density > 3 ? 'danger' : z.avg_density > 1.5 ? 'warning' : 'success'}>
                        {z.avg_density.toFixed(1)} p/m²
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-white/60">{z.peak_count}</td>
                    <td className="py-3 text-sm font-medium text-white/60">{z.alerts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Alert Log */}
      <GlassCard hover={false}>
        <h3 className="text-sm font-semibold text-white mb-4">Recent Alerts</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {reportData.alert_log.length > 0 ? (
            reportData.alert_log.slice(0, 20).map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <span className="text-xs font-mono text-white/30 w-24 flex-shrink-0">{new Date(a.time).toLocaleString()}</span>
                <Badge variant={a.level === 'danger' ? 'danger' : a.level === 'warning' ? 'warning' : 'info'}>
                  {a.type}
                </Badge>
                <span className="text-xs text-white/50 flex-1 truncate">{a.zone}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">No alerts in selected period</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Date range info */}
      <div className="text-center">
        <p className="text-[10px] text-white/20">
          Report period: {new Date(reportData.date_range.start).toLocaleDateString()} - {new Date(reportData.date_range.end).toLocaleDateString()}
          {selectedDate && ` • Showing detailed data for ${selectedDate}`}
          {!selectedDate && timeRange === '1day' && ` • Last 24 hours`}
          {!selectedDate && timeRange === '7days' && ` • Last 7 days`}
          {!selectedDate && timeRange === '30days' && ` • Last 30 days`}
        </p>
      </div>
    </motion.div>
  );
}