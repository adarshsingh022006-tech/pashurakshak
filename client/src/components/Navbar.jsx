import React from 'react';
import { Globe, WifiOff, RefreshCw, Menu, Shield, Stethoscope, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useNotifications } from '../context/NotificationContext';
import { translations } from '../i18n/translations';
import BrandLogo from './BrandLogo';
import WeatherChip from './WeatherChip';
import { Link } from 'react-router-dom';

export default function Navbar({ onMenuToggle }) {
  const { user, role, language, changeLanguage } = useAuth();
  const { isOnline, pendingReports } = useOffline();
  const { unreadCount } = useNotifications();
  const t = translations[language] || translations.en;

  const getRoleBadge = () => {
    if (role === 'vet') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Stethoscope size={13} />
          {t.vet}
        </span>
      );
    }
    if (role === 'authority') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-navy-dark border border-blue-300">
          <Shield size={13} />
          {t.authority}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-pashu-dark border border-green-300">
        <User size={13} />
        {t.farmer}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Mobile hamburger + Logo on small screens */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle Menu"
          >
            <Menu size={22} />
          </button>
          <div className="md:hidden">
            <Link to="/">
              <BrandLogo size="small" />
            </Link>
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-slate-500">
            {t.tagline}
          </span>
        </div>

        {/* Right: Weather chip + Offline indicator + Language selector + Role Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Weather Chip */}
          <WeatherChip />

          {/* Quick 1962 Ambulance Hotline Pill */}
          <Link
            to="/ambulance"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors shadow-2xs"
            title="1962 Pashu Ambulance Tracker"
          >
            <span>🚑 1962 Ambulance</span>
          </Link>

          {/* Offline / Pending Sync indicators */}
          {!isOnline && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
              <WifiOff size={13} />
              <span className="hidden sm:inline">Offline</span>
            </span>
          )}

          {pendingReports.length > 0 && (
            <span
              title="Reports waiting to sync with server"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
            >
              <RefreshCw size={12} className="animate-spin" />
              <span>{pendingReports.length} {t.pendingSync}</span>
            </span>
          )}

          {/* Language selector dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700">
              <Globe size={13} className="text-slate-500" />
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer text-slate-800 pr-1"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
              </select>
            </div>
          </div>

          {/* Role Badge */}
          {user && (
            <div className="flex items-center gap-2">
              {getRoleBadge()}
            </div>
          )}

          {/* Quick link to Alerts */}
          {user && (
            <Link
              to="/alerts"
              className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full"
              title={t.alerts}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
