import { useState } from 'react';
import Navbar from './Navbar';
import WeatherSearch from './WeatherSearch';
import SearchHistory from './SearchHistory';
import Analytics from './Analytics';
import AdminPanel from './AdminPanel';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-storm-950 to-gray-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'search' && <WeatherSearch onSearchComplete={handleSearchComplete} />}
        {activeTab === 'history' && <SearchHistory onView={handleViewFromHistory} />}
        {activeTab === 'analytics' && <Analytics data={analyticsData} />}
        {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
