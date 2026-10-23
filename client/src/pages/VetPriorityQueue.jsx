import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Filter,
  Stethoscope,
  Calendar,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function VetPriorityQueue() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('3days'); // 3-day window

  useEffect(() => {
    api.get('/reports?limit=60')
      .then(res => {
        const list = res.data.reports || [];
        // Sort by risk priority (High > Medium > Low) then oldest first (age of report)
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        const sorted = [...list].sort((a, b) => {
          const pA = priorityOrder[a.risk_level] || 0;
          const pB = priorityOrder[b.risk_level] || 0;
          if (pB !== pA) return pB - pA;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setReports(sorted);
      })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  const activeReports = reports.filter(r => {
    if (timeFilter === '3days') {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      return new Date(r.created_at).getTime() >= threeDaysAgo;
    }
    return true;
  });

  const highRiskUnverified = activeReports.filter(r => r.risk_level === 'High' && !r.is_verified);
  const highRiskTotal = activeReports.filter(r => r.risk_level === 'High');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-navy-dark">
              Veterinary Priority Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
              {highRiskTotal.length} Critical Cases
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Algorithmically triaged queue sorted by AI risk probability and case urgency.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-950 text-xs font-semibold"
          >
            <option value="3days">⏱️ Last 3 Days</option>
            <option value="all">📅 All Time</option>
          </select>
          <Link
            to="/vet/cases"
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            Manage All Cases &rarr;
          </Link>
        </div>
      </div>

      {/* High-Risk Action Banner */}
      {highRiskUnverified.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-600 text-white shadow-sm flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="shrink-0 text-white animate-pulse" />
            <div className="text-xs sm:text-sm">
              <strong>{highRiskUnverified.length} High-Risk cases await verification.</strong> Human-in-the-loop protocol requires a licensed veterinarian to confirm diagnosis.
            </div>
          </div>
          <button
            onClick={() => navigate(`/case/${highRiskUnverified[0]?.id}`)}
            className="px-4 py-1.5 rounded-xl bg-white text-red-700 text-xs font-black hover:bg-slate-100"
          >
            Review Top Case
          </button>
        </div>
      )}

      {/* Priority Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Triage Order: High Risk &rarr; Medium Risk &rarr; Low Risk ({timeFilter === '3days' ? '3-Day Active Window' : 'All'})
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Total in queue: {activeReports.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Triage Priority</th>
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Animal & Herd</th>
                <th className="py-3 px-4">Symptoms</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeReports.map((report) => {
                let symptoms = [];
                try {
                  symptoms = typeof report.symptoms === 'string' ? JSON.parse(report.symptoms) : (report.symptoms || []);
                } catch (e) {
                  symptoms = [];
                }

                const isHigh = report.risk_level === 'High';
                const isMedium = report.risk_level === 'Medium';

                return (
                  <tr
                    key={report.id}
                    onClick={() => navigate(`/case/${report.id}`)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      isHigh ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isHigh
                            ? 'bg-red-600 text-white shadow-xs'
                            : isMedium
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-green-100 text-green-900 border border-green-300'
                        }`}
                      >
                        {isHigh && <AlertTriangle size={12} />}
                        {report.risk_level}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-navy">
                      {report.report_number}
                    </td>

                    <td className="py-3.5 px-4 font-medium capitalize text-slate-800">
                      {report.species} {report.age ? `(${report.age}y)` : ''}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        Tag: {report.animal_tag || 'N/A'} • {report.vaccination_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {symptoms.slice(0, 3).map((sym, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                          >
                            {sym.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {report.village || 'Samrala'}, {report.district || 'Ludhiana'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          report.status === 'Visit Scheduled'
                            ? 'bg-blue-100 text-blue-800 font-bold'
                            : report.status === 'In Treatment'
                            ? 'bg-purple-100 text-purple-800 font-bold'
                            : report.status === 'Under Review'
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/case/${report.id}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold hover:bg-navy-dark shadow-2xs"
                      >
                        Review
                      </button>
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
