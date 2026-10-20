import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthorityStats, getAuthorityComplaints } from '../../services/authorityApi';
import { motion } from 'framer-motion';

const AuthorityDashboard = () => {
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [authFilter, setAuthFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const statsRes = await getAuthorityStats();
        setStats(statsRes.data);
        const compRes = await getAuthorityComplaints(filter, authFilter);
        setComplaints(compRes.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('authorityToken');
          navigate('/authority/login');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [filter, authFilter, navigate]);

  if (loading) return <div className="pt-24 text-center">Loading dashboard...</div>;

  return (
    <div className="min-h-screen pt-24 px-6 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Authority Dashboard</h1>
        <button 
          onClick={() => { localStorage.removeItem('authorityToken'); navigate('/authority/login'); }}
          className="bg-red-500/20 text-red-300 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Complaints', value: stats.total, color: 'text-blue-400' },
          { label: 'Open', value: stats.open, color: 'text-yellow-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-purple-400' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800/50 p-6 rounded-xl border border-white/10 text-center">
            <h3 className="text-gray-400 text-sm font-medium mb-2">{stat.label}</h3>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2 flex-1">
          {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'Pending', 'In Progress', 'Resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {f === '' ? 'All Status' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2 border-l border-white/10 pl-0 md:pl-4">
          {[
            { id: '', label: 'All Authorities' },
            { id: 'municipal_corporation', label: 'Municipal Corp' },
            { id: 'municipal_council', label: 'Municipal Council' },
            { id: 'gram_panchayat', label: 'Gram Panchayat' }
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => setAuthFilter(a.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                authFilter === a.id ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaints.map((c, i) => (
          <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden flex flex-col"
          >
            <img src={c.imageUrl} alt={c.problemType} className="w-full h-48 object-cover" />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold text-lg text-white leading-tight">{c.problemType}</h3>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${c.status === 'RESOLVED' || c.status === 'Resolved' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {c.status}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {c.authorityType?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4 flex-1">{c.location?.address || `${c.area}, ${c.city}`}</p>
              <button onClick={() => navigate(`/authority/complaints/${c._id}`)} className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors text-sm">
                View & Update
              </button>
            </div>
          </motion.div>
        ))}
        {complaints.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No complaints found.</div>}
      </div>
    </div>
  );
};

export default AuthorityDashboard;
