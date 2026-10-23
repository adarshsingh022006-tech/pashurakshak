import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import api from '../services/api';

export default function VetManageCases() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters (Defaulting to 3 days surveillance window as requested)
  const [timeFilter, setTimeFilter] = useState('3days');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports?limit=100');
      let list = res.data.reports || [];
      if (location.state?.newReport) {
        const exists = list.some(r => r.id === location.state.newReport.id || r.report_number === location.state.newReport.report_number);
        if (!exists) {
          list = [location.state.newReport, ...list];
        }
      }
      setReports(list);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filtered = reports.filter((r) => {
    if (timeFilter === '3days') {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const reportTime = new Date(r.created_at).getTime();
      if (reportTime < threeDaysAgo && (!location.state?.newReport || r.id !== location.state.newReport.id)) {
        return false;
      }
    }
    if (speciesFilter !== 'all' && r.species?.toLowerCase() !== speciesFilter) return false;
    if (riskFilter !== 'all' && r.risk_level !== riskFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNum = r.report_number?.toLowerCase().includes(q);
      const matchVill = r.village?.toLowerCase().includes(q);
      const matchSp = r.species?.toLowerCase().includes(q);
      if (!matchNum && !matchVill && !matchSp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Newly submitted report alert banner */}
      {location.state?.justSubmitted && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-emerald-950">
                  {location.state?.reportNumber ? `${location.state.reportNumber} Registered!` : 'New Case Registered!'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-950 uppercase">
                  {location.state?.riskLevel || 'High'} Risk
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                {location.state?.message || 'Report automatically routed to the Doctor Triage Queue.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.history.replaceState({}, document.title)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-emerald-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-navy-dark">
              Manage Veterinary Cases
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              {filtered.length} Cases {timeFilter === '3days' ? '(3-Day Window)' : ''}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Clinical management workspace for case tracking, status transitions, and doctor treatment monitoring.
          </p>
        </div>

        <button
          onClick={fetchCases}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search case #, village, species..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto text-xs">
            {/* Time Window (3 Days vs All) */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold"
            >
              <option value="3days">⏱️ Last 3 Days (Active)</option>
              <option value="all">📅 All Time Records</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Visit Scheduled">Visit Scheduled</option>
              <option value="In Treatment">In Treatment</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Species */}
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium capitalize"
            >
              <option value="all">All Species</option>
              <option value="cow">Cow</option>
              <option value="buffalo">Buffalo</option>
              <option value="goat">Goat</option>
              <option value="sheep">Sheep</option>
              <option value="poultry">Poultry</option>
            </select>

            {/* Risk */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Risk</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Animal</th>
                <th className="py-3 px-4">Symptoms</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Owner / Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((report) => {
                let symptoms = [];
                try {
                  symptoms = typeof report.symptoms === 'string' ? JSON.parse(report.symptoms) : (report.symptoms || []);
                } catch (e) {
                  symptoms = [];
                }

                const isHigh = report.risk_level === 'High';

                return (
                  <tr
                    key={report.id}
                    onClick={() => navigate(`/case/${report.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">
                      {report.report_number}
                    </td>

                    <td className="py-3.5 px-4 font-medium capitalize text-slate-800">
                      {report.species} {report.age ? `(${report.age}y)` : ''}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {symptoms.slice(0, 2).map((sym, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                          >
                            {sym.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isHigh
                            ? 'bg-red-100 text-red-800'
                            : report.risk_level === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {report.risk_level}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-xs text-slate-700">
                        {report.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{report.village || 'Samrala'}</div>
                      <div className="text-[11px] text-slate-400">{report.owner_name || 'Farmer'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs font-bold text-navy hover:underline">
                        Manage Case &rarr;
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
