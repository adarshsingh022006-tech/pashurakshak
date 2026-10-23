import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  Bell,
  LogOut,
  AlertTriangle,
  Stethoscope,
  Calendar,
  BarChart3,
  Skull,
  UserPlus,
  Home,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { translations } from '../i18n/translations';
import BrandLogo from './BrandLogo';

export default function Sidebar({ isOpen, onClose }) {
  const { user, role, logout, login, language } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const handleDemoSwitch = async (email) => {
    try {
      await login(email, 'Demo@123');
      if (email.startsWith('farmer')) navigate('/dashboard');
      else if (email.startsWith('vet')) navigate('/vet/priority');
      else if (email.startsWith('govt')) navigate('/authority');
      if (onClose) onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-4 border-pashu-DEFAULT shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <NavLink to="/" onClick={onClose} className="focus:outline-none">
            <BrandLogo size="default" />
          </NavLink>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Menu */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {t.mainMenu}
            </div>

            <nav className="space-y-1">
              <NavLink to="/dashboard" className={navItemClass} onClick={onClose}>
                <LayoutDashboard size={18} className="text-pashu-DEFAULT" />
                <span>{t.dashboard}</span>
              </NavLink>

              <NavLink to="/report" className={navItemClass} onClick={onClose}>
                <PlusCircle size={18} className="text-emerald-600" />
                <span>{t.reportAnimal}</span>
              </NavLink>

              <NavLink to="/add-animal" className={navItemClass} onClick={onClose}>
                <UserPlus size={18} className="text-teal-600" />
                <span>{t.addAnimal}</span>
              </NavLink>

              <NavLink to="/report-mortality" className={navItemClass} onClick={onClose}>
                <Skull size={18} className="text-rose-600" />
                <span>{t.reportMortality}</span>
              </NavLink>

              <NavLink to="/records" className={navItemClass} onClick={onClose}>
                <FileText size={18} className="text-indigo-600" />
                <span>{t.healthRecords}</span>
              </NavLink>

              <NavLink to="/map" className={navItemClass} onClick={onClose}>
                <MapPin size={18} className="text-navy-light" />
                <span>{t.outbreakMap}</span>
              </NavLink>

              <NavLink to="/alerts" className={navItemClass} onClick={onClose}>
                <div className="relative flex items-center">
                  <Bell size={18} className="text-amber-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span>{t.alerts}</span>
              </NavLink>
            </nav>
          </div>

          {/* Veterinarian Specific Links (Available for quick doctor triage inspection) */}
          {(role === 'vet' || role === 'authority' || role === 'farmer' || !role) && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                DOCTOR & VET ACTIONS
              </div>
              <nav className="space-y-1">
                <NavLink to="/vet/priority" className={navItemClass} onClick={onClose}>
                  <AlertTriangle size={18} className="text-red-500" />
                  <span>{t.priorityQueue}</span>
                </NavLink>

                <NavLink to="/vet/cases" className={navItemClass} onClick={onClose}>
                  <Stethoscope size={18} className="text-blue-600" />
                  <span>{t.manageCases}</span>
                </NavLink>

                <NavLink to="/vet/visits" className={navItemClass} onClick={onClose}>
                  <Calendar size={18} className="text-violet-600" />
                  <span>{t.scheduleVisits}</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Government Authority Specific Links */}
          {(role === 'authority' || role === 'vet') && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                STATE SURVEILLANCE
              </div>
              <nav className="space-y-1">
                <NavLink to="/authority" className={navItemClass} onClick={onClose}>
                  <BarChart3 size={18} className="text-navy-light" />
                  <span>{t.surveillance}</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* PashuRakshak Loop & About Link */}
          <div>
            <nav className="space-y-1 pt-2 border-t border-slate-100">
              <NavLink to="/about" className={navItemClass} onClick={onClose}>
                <Home size={18} className="text-slate-500" />
                <span>Intelligence Loop</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Demo Role Switcher & User Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
            DEMO ROLE SWITCH
          </div>
          <div className="grid grid-cols-3 gap-1 mb-3">
            <button
              onClick={() => handleDemoSwitch('farmer@demo.com')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md border text-center transition-colors ${
                role === 'farmer'
                  ? 'bg-green-600 text-white border-green-600 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Farmer
            </button>
            <button
              onClick={() => handleDemoSwitch('vet@demo.com')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md border text-center transition-colors ${
                role === 'vet'
                  ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Vet
            </button>
            <button
              onClick={() => handleDemoSwitch('govt@demo.com')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md border text-center transition-colors ${
                role === 'authority'
                  ? 'bg-navy text-white border-navy font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Govt
            </button>
          </div>

          {/* Logged in User info + Logout */}
          {user ? (
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="truncate max-w-[140px]">
                <div className="font-semibold text-slate-800 truncate">{user.name}</div>
                <div className="text-slate-400 text-[10px] truncate">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                title={t.logout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="block w-full py-2 text-center text-xs font-semibold bg-pashu-dark text-white rounded-lg"
              onClick={onClose}
            >
              {t.login}
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
