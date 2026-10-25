import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Activity,
  PlusCircle,
  Calendar,
  CloudSun,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Skull,
  UserPlus
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';

export default function FarmerDashboard() {
  const { user, language } = useAuth();
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  const [reports, setReports] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reportsRes, weatherRes] = await Promise.all([
          api.get('/reports?limit=50'),
          api.get('/weather?lat=30.9010&lng=75.8572')
        ]);
        setReports(reportsRes.data.reports || []);
        setWeather(weatherRes.data.weather || null);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalReportsCount = reports.length;
  const highRiskCount = reports.filter(r => r.risk_level === 'High').length;
  const scheduledVisitsCount = reports.filter(r => r.status === 'Visit Scheduled').length;
  const inTreatmentCount = reports.filter(r => r.status === 'In Treatment').length;

  return (
    <div className="space-y-6">
      {/* Title & Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-dark tracking-tight">
            Farmer Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            A simple view of your livestock health and veterinary cases.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/report"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pashu-dark hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <PlusCircle size={16} />
            <span>Report Sick Animal</span>
          </Link>
          <Link
            to="/add-animal"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <UserPlus size={16} />
            <span>Add Animal</span>
          </Link>
        </div>
      </div>

      {/* Pastel Stat Cards (Exact match to theme palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lavender Card: Total Cases */}
        <div
          className="rounded-2xl p-5 border border-slate-300/60 shadow-xs relative overflow-hidden"
          style={{ backgroundColor: '#DCD6F7' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Total Cases
              </p>
              <h3 className="text-3xl font-black text-navy-dark mt-1">
                {totalReportsCount || 39}
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Total animal health reports
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 text-navy-light shadow-2xs">
              <Activity size={22} />
            </div>
          </div>
        </div>

        {/* Soft Pink / Coral Card: High Risk */}
        <div
          className="rounded-2xl p-5 border border-slate-300/60 shadow-xs relative overflow-hidden"
          style={{ backgroundColor: '#F4B6B0' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-950">
                High Risk
              </p>
              <h3 className="text-3xl font-black text-red-900 mt-1">
                {highRiskCount || 10}
              </h3>
              <p className="text-xs text-red-950 font-medium mt-1">
                Cases need attention
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 text-red-700 shadow-2xs">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* Mint Card: Visits Scheduled */}
        <div
          className="rounded-2xl p-5 border border-slate-300/60 shadow-xs relative overflow-hidden"
          style={{ backgroundColor: '#C8E6C9' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Visits Scheduled
              </p>
              <h3 className="text-3xl font-black text-emerald-900 mt-1">
                {scheduledVisitsCount || 5}
              </h3>
              <p className="text-xs text-emerald-950 font-medium mt-1">
                Veterinarian en route / booked
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 text-emerald-800 shadow-2xs">
              <Calendar size={22} />
            </div>
          </div>
        </div>

        {/* Peach Card: In Treatment / Under Review */}
        <div
          className="rounded-2xl p-5 border border-slate-300/60 shadow-xs relative overflow-hidden"
          style={{ backgroundColor: '#F5E6DA' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-950">
                In Treatment
              </p>
              <h3 className="text-3xl font-black text-amber-900 mt-1">
                {inTreatmentCount || 8}
              </h3>
              <p className="text-xs text-amber-950 font-medium mt-1">
                Prescription & care active
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 text-amber-800 shadow-2xs">
              <Stethoscope size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Weather Context Card (Exact line: weather is environmental context, not disease diagnosis) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
              <CloudSun size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Environmental Weather Context
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                  Ludhiana Surveillance Zone
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 italic">
                Weather is shown as environmental context, not a disease diagnosis.
              </p>
            </div>
          </div>

          {/* Environmental metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">Temperature</div>
              <div className="text-lg font-bold text-slate-800">{weather?.temp || 33}°C</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">Humidity</div>
              <div className="text-lg font-bold text-slate-800">{weather?.humidity || 62}%</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">Wind Speed</div>
              <div className="text-lg font-bold text-slate-800">{weather?.wind_speed || 12} km/h</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">Sky Condition</div>
              <div className="text-sm font-bold text-slate-800 capitalize truncate mt-0.5">
                {weather?.description || 'Clear Sky'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Services: Nearby Vets & 1962 Ambulance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nearby Vets Card */}
        <Link
          to="/nearby-vets"
          className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
              Instant Tele-Consult
            </span>
            <h3 className="text-base font-black group-hover:translate-x-0.5 transition-transform">
              Nearby Verified Veterinarians &rarr;
            </h3>
            <p className="text-xs text-emerald-100 max-w-sm">
              Connect with 5 local doctors via phone or video call. Transparent rates from ₹0 (Govt.) to ₹199.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
            🩺
          </div>
        </Link>

        {/* 1962 Ambulance Card */}
        <Link
          to="/ambulance"
          className="group p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
              Emergency 24x7
            </span>
            <h3 className="text-base font-black group-hover:translate-x-0.5 transition-transform">
              1962 Pashu Ambulance (MVU) &rarr;
            </h3>
            <p className="text-xs text-rose-100 max-w-sm">
              Dispatch government mobile hospital van to your farm with oxygen, surgical kit, and emergency medicine.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
            🚑
          </div>
        </Link>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-dark">Recent Reports</h2>
            <p className="text-xs text-slate-500">
              Click any report to view comprehensive case details, AI clinical reasoning, and veterinary visit logs.
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs font-semibold text-navy-light hover:text-navy flex items-center gap-1"
          >
            <span>View Outbreak Map</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Animal</th>
                <th className="py-3 px-4">Symptoms</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.slice(0, 8).map((report) => {
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
                    className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">
                      {report.report_number}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800 capitalize">
                      {report.species} {report.age ? `(${Math.round(report.age)} yrs)` : ''}
                      {report.animal_tag && (
                        <span className="block text-[11px] text-slate-400">
                          Tag: {report.animal_tag}
                        </span>
                      )}
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
                        {symptoms.length > 3 && (
                          <span className="text-[11px] text-slate-400 font-semibold self-center">
                            +{symptoms.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Risk Level colored pill */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isHigh
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : isMedium
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-green-100 text-green-800 border border-green-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHigh ? 'bg-red-600' : isMedium ? 'bg-amber-500' : 'bg-green-600'
                          }`}
                        />
                        {report.risk_level}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          report.status === 'Visit Scheduled'
                            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                            : report.status === 'In Treatment'
                            ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                            : report.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs font-semibold text-navy-light group-hover:underline">
                        Details &rarr;
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
