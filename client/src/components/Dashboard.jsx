import { useState } from 'react';
import Navbar from './Navbar';
import HomePage from './HomePage';
import WeatherSearch from './WeatherSearch';
import SearchHistory from './SearchHistory';
import Analytics from './Analytics';
import AdminPanel from './AdminPanel';
import ChangePassword from './ChangePassword';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [analyticsData, setAnalyticsData] = useState(null);

  const handleSearchComplete = (data) => {
    setAnalyticsData(data);
    setActiveTab('analytics');
  };

  const handleViewFromHistory = (data) => {
    setAnalyticsData(data);
    setActiveTab('analytics');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-storm-950 dark:to-gray-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'home' && <HomePage onNavigate={setActiveTab} />}
        {activeTab === 'search' && <WeatherSearch onSearchComplete={handleSearchComplete} />}
        {activeTab === 'history' && <SearchHistory onView={handleViewFromHistory} />}
        {activeTab === 'analytics' && <Analytics data={analyticsData} />}
        {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}
        {activeTab === 'password' && <ChangePassword />}
      </main>
    </div>
  );
}
