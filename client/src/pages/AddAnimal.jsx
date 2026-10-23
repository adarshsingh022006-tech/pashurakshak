import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function AddAnimal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name_or_tag: '',
    species: 'cow',
    age: 3,
    sex: 'female',
    breed: '',
    vaccination_status: 'Vaccinated'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name_or_tag.trim()) {
      setError('Please provide an animal tag or name.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await api.post('/animals', {
        ...formData,
        age: parseInt(formData.age) || 3
      });
      setSuccess('Animal successfully registered in herd records!');
      setTimeout(() => {
        navigate('/records');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add animal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="p-3 rounded-xl bg-emerald-100 text-pashu-dark">
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-navy-dark">
              Register New Animal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Add livestock to your herd registry for streamlined health reporting and historical surveillance.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Species */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
              Species *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['cow', 'buffalo', 'goat', 'sheep', 'pig', 'poultry'].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setFormData({ ...formData, species: sp })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all text-center ${
                    formData.species === sp
                      ? 'bg-pashu-dark text-white border-pashu-dark shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Tag / Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Tag Number or Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 0036 or Lakshmi"
              value={formData.name_or_tag}
              onChange={(e) => setFormData({ ...formData, name_or_tag: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Age & Sex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Age (Whole Years)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="25"
                placeholder="e.g. 3"
                value={formData.age}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    age: val === '' ? '' : Math.max(1, Math.min(25, parseInt(val) || 1))
                  });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <span className="text-[10px] text-slate-400">Enter full years (e.g. 1, 2, 3... no decimals)</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Sex
              </label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Breed (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sahiwal, Murrah, Beetal, Gir..."
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Vaccination Status */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
              Vaccination Status *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['Vaccinated', 'Partially Vaccinated', 'Unvaccinated'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, vaccination_status: status })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    formData.vaccination_status === status
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-pashu-dark hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Save Animal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
