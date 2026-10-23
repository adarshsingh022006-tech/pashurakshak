import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  User,
  Plus
} from 'lucide-react';
import api from '../services/api';

export default function VetScheduleVisits() {
  const [reportsWithVisits, setReportsWithVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports?status=Visit Scheduled')
      .then(res => {
        const list = (res.data.reports || []).filter(r => r.status === 'Visit Scheduled');
        setReportsWithVisits(list);
      })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-dark">
            Schedule & Dispatch Visits
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Mobile veterinary team assignments, on-site diagnostics, and farm visit roster.
          </p>
        </div>

        <Link
          to="/vet/priority"
          className="px-4 py-2 rounded-xl bg-pashu-dark text-white text-xs font-bold hover:bg-emerald-900 self-start"
        >
          Priority Queue &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsWithVisits.length === 0 ? (
          <div className="md:col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No active visits scheduled at this time.
          </div>
        ) : (
          reportsWithVisits.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-navy text-sm">
                      {report.report_number}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize">
                      {report.species} ({Math.round(report.age || 3)} yrs)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  Visit Scheduled
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-red-500" />
                  <span>Farm Location: <strong>{report.village || 'Samrala'}, {report.district || 'Ludhiana'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  <span>Owner: {report.owner_name || 'Farmer'} ({report.owner_phone || '+91 98765 43210'})</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-700 font-medium">
                  "{report.free_text_notes || 'Clinical signs require urgent physical evaluation.'}"
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Risk Level: <strong className="text-red-600 font-bold">{report.risk_level}</strong>
                </span>

                <Link
                  to={`/case/${report.id}`}
                  className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-dark"
                >
                  Open Case & Record Visit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
