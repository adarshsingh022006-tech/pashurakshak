import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UserPlus,
  Calendar,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import api from '../services/api';

export default function HealthRecords() {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [animalReports, setAnimalReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/animals')
      .then(res => {
        const list = res.data.animals || [];
        setAnimals(list);
        if (list.length > 0) {
          selectAnimal(list[0]);
        }
      })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  const selectAnimal = async (animal) => {
    setSelectedAnimal(animal);
    try {
      const res = await api.get(`/animals/${animal.id}`);
      setAnimalReports(res.data.reports || []);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-dark">
            Livestock Health Records
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Per-animal longitudinal health history, vaccination certificates, and clinical visit timeline.
          </p>
        </div>

        <Link
          to="/add-animal"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pashu-dark hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs self-start"
        >
          <UserPlus size={15} />
          <span>Register New Animal</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Animals List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            Registered Herd ({animals.length})
          </h2>

          <div className="space-y-2">
            {animals.map((a) => {
              const isSelected = selectedAnimal?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => selectAnimal(a)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm capitalize text-slate-900">
                      {a.species} – Tag #{a.name_or_tag}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.vaccination_status === 'Vaccinated'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {a.vaccination_status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Age: {Math.round(a.age || 3)} yrs | {a.sex}</span>
                    <span>{a.breed || 'Indigenous'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Animal Longitudinal Timeline */}
        <div className="md:col-span-2 space-y-5">
          {selectedAnimal && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Animal Passport</span>
                  <h2 className="text-xl font-black text-navy-dark capitalize">
                    {selectedAnimal.species} (Tag: {selectedAnimal.name_or_tag})
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                    <ShieldCheck size={13} />
                    {selectedAnimal.vaccination_status}
                  </span>
                </div>
              </div>

              {/* Longitudinal Health Events Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Clinical Timeline & Surveillance Reports
                </h3>

                {animalReports.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                    No illness reports logged for this animal. Status is healthy and verified.
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                    {animalReports.map((r) => {
                      let symptoms = [];
                      try {
                        symptoms = typeof r.symptoms === 'string' ? JSON.parse(r.symptoms) : (r.symptoms || []);
                      } catch (e) {
                        symptoms = [];
                      }

                      return (
                        <div key={r.id} className="relative pl-8 space-y-1">
                          {/* Dot */}
                          <div
                            className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                              r.risk_level === 'High'
                                ? 'bg-red-600'
                                : r.risk_level === 'Medium'
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                          />

                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-navy text-sm font-mono">
                                {r.report_number}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  r.risk_level === 'High'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {r.risk_level} Risk
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 mt-1">
                              <strong>Symptoms: </strong>
                              {symptoms.join(', ')}
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5 italic">
                              Status: <span className="font-semibold text-slate-700">{r.status}</span>
                            </p>

                            <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                              <Link
                                to={`/case/${r.id}`}
                                className="font-bold text-navy-light hover:underline flex items-center gap-1"
                              >
                                <span>View Full Case</span>
                                <ChevronRight size={13} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
