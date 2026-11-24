import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Map, FileText, Camera, Sparkles, Zap, Shield, Activity, 
  CheckCircle2, Clock, MapPin, Building2, Globe, ThumbsUp, AlertTriangle, 
  ChevronRight, Eye, Layers, Check, Droplets, Lightbulb, Trash2, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');

  const stats = [
    { value: '24,500+', label: 'Issues Resolved', sub: 'Across 65+ municipal wards', icon: CheckCircle2, color: 'text-[#16A34A]' },
    { value: '94.8%', label: 'Resolution Rate', sub: 'Within 7 business days', icon: Activity, color: 'text-[#0284C7]' },
    { value: '< 48 hrs', label: 'Avg. First Response', sub: 'Direct municipal intake', icon: Clock, color: 'text-[#D97706]' },
    { value: '13 Languages', label: 'Automated Petitions', sub: 'Formal local language letters', icon: Globe, color: 'text-[#7C3AED]' },
  ];

  const categories = [
    { id: 'potholes', name: 'Roads & Potholes', icon: AlertTriangle, color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', count: '8.4k resolved', desc: 'Potholes, broken asphalt, uneven road surfaces, missing manhole covers.' },
    { id: 'garbage', name: 'Waste & Sanitation', icon: Trash2, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', count: '6.1k resolved', desc: 'Overflowing dumpsters, public littering, uncollected residential waste.' },
    { id: 'streetlights', name: 'Streetlights & Poles', icon: Lightbulb, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', count: '4.2k resolved', desc: 'Dark road stretches, blinking lamps, hazardous exposed electrical cables.' },
    { id: 'water', name: 'Water & Pipelines', icon: Droplets, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', count: '3.8k resolved', desc: 'Burst supply mains, low pressure, contaminated municipal drinking water.' },
    { id: 'drainage', name: 'Drainage & Sewage', icon: Layers, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', count: '2.0k resolved', desc: 'Blocked storm gutters, stagnant rainwater, overflowing sewer lines.' },
    { id: 'public', name: 'Public Hazards', icon: Shield, color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', count: '1.5k resolved', desc: 'Illegal encroachments, damaged footpaths, fallen branches, safety hazards.' }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Snap & Instant Detection',
      desc: 'Take a quick photo of the issue. Our integrated vision model instantly classifies the defect category, extracts verified GPS coordinates, and assigns severity.',
      badge: 'Vision AI & EXIF Verification',
      icon: Camera
    },
    {
      step: '02',
      title: 'Automated Authority Routing',
      desc: 'Our engine identifies the jurisdictional body—Gram Panchayat, Municipal Council, or Corporation—and auto-generates a standardized formal petition in 13 languages.',
      badge: 'Auto Legal Letter Generator',
      icon: Building2
    },
    {
      step: '03',
      title: 'Transparent Public Tracking',
      desc: 'Follow the progress in real time with an open audit timeline. Fellow citizens can upvote urgent reports, and authorities submit before/after photographic proof of resolution.',
      badge: 'Verified Before & After Closure',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#334155] font-sans antialiased overflow-x-hidden selection:bg-[#E0F2FE] selection:text-[#0369A1]">
      
      {/* =========================================================================
          HERO SECTION
         ========================================================================= */}
      <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden bg-white border-b border-[#E5E7EB]">
        {/* Subtle architectural background grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.35]" 
          style={{
            backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#F0F9FF] to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header pill & Typography */}
          <div className="text-center max-w-4xl mx-auto">
            
            {/* Announcement Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] text-xs font-semibold shadow-xs mb-6 hover:bg-[#E0F2FE] transition-colors cursor-default"
            >
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Next-Gen Civic Action Platform</span>
              <span className="text-[#9CA3AF]">•</span>
              <span className="text-[#0369A1] hidden sm:inline">AI Vision & Municipal Routing</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0284C7]" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#0F172A] tracking-tight leading-[1.1] mb-6"
            >
              Transform City Issues Into{' '}
              <span className="text-[#0284C7] relative inline-block">
                Transparent Action
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-xl text-[#4B5563] max-w-2xl mx-auto mb-9 leading-relaxed font-normal"
            >
              Empowering citizens and municipal authorities with instant photo-based defect recognition, automatic formal grievance drafting, and transparent end-to-end resolution.
            </motion.p>

            {/* CTA Action Group */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10"
            >
              {!isAdmin && (
                <button
                  onClick={() => navigate('/submit')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base group"
                >
                  <Camera className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>Report an Issue</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-[#F3F4F6] text-[#0F172A] font-semibold rounded-xl border border-[#D1D5DB] hover:border-[#9CA3AF] shadow-xs transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base"
              >
                <Map className="w-4 h-4 text-[#0284C7]" />
                <span>Explore City Live Map</span>
              </button>
            </motion.div>

            {/* Trust Points Ribbon */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#6B7280] font-medium"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Zero Bureaucracy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Auto-Drafted Formal Petitions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Real-Time Public Accountability</span>
              </div>
            </motion.div>

          </div>

          {/* =========================================================================
              HERO PRODUCT SHOWCASE / INTERACTIVE SAAS MOCKUP
             ========================================================================= */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-14 sm:mt-18 max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl bg-white border border-[#E5E7EB] shadow-xl p-2 sm:p-4">
              
              {/* Window Chrome / Titlebar */}
              <div className="flex items-center justify-between pb-3 px-2 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#10B981]/80" />
                  <span className="ml-2 text-xs font-mono font-medium text-[#6B7280] hidden sm:inline">
                    civic-reporter.gov / live-intake-console
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                    System Live • All Wards Active
                  </span>
                </div>
              </div>

              {/* Showcase Inner Card Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-3 sm:p-5 bg-[#F9FAFB] rounded-xl mt-3">
                
                {/* Left: Incident Preview */}
                <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#0284C7] border border-[#BAE6FD]">
                            REPORT #CR-1024
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                            In Progress
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
                          Deep Road Pothole & Damaged Surface
                        </h3>
                        <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                          Station Road, Ward 14 • Near Central Market
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] shrink-0">
                        High Priority
                      </span>
                    </div>

                    <p className="text-xs text-[#4B5563] leading-relaxed mb-4">
                      Dangerous asphalt cavity causing severe vehicular disruption. Auto-verified via geolocation coordinates (16.7050° N, 74.2433° E).
                    </p>

                    {/* AI Confidence Meter */}
                    <div className="bg-[#F0F9FF] border border-[#BAE6FD] p-3 rounded-lg mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-bold text-[#0F172A]">Vision Model Confidence</p>
                          <p className="text-[11px] text-[#0369A1]">Pothole & Surface Erosion (98.4% match)</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#0284C7] bg-white px-2 py-1 rounded border border-[#BAE6FD]">
                        Auto-Classified
                      </span>
                    </div>
                  </div>

                  {/* Status Track */}
                  <div className="pt-3 border-t border-[#E5E7EB]">
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#6B7280] mb-2">
                      <span className="text-[#0284C7] font-semibold">1. Reported</span>
                      <span className="text-[#0284C7] font-semibold">2. Under Review</span>
                      <span className="text-[#D97706] font-bold">3. In Progress</span>
                      <span>4. Resolved</span>
                    </div>
                    <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden flex">
                      <div className="w-3/4 bg-[#0284C7] h-full rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Right: Authority & Resolution Preview */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  
                  {/* Routed Authority Card */}
                  <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Assigned Authority</p>
                        <h4 className="text-sm font-bold text-[#0F172A]">Municipal Corporation · Roads Dept</h4>
                      </div>
                    </div>
                    <p className="text-xs text-[#4B5563]">
                      Automated petition sent with location boundaries, RTI tracking ID, and official gazetted template.
                    </p>
                  </div>

                  {/* Community Upvotes & Engagement */}
                  <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#4B5563]">Community Validation</span>
                        <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5" /> 84 Citizens Endorsed
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Local neighborhood upvotes elevate this complaint on the Municipal Ward dashboard.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                      <span className="text-[#6B7280]">Est. Completion:</span>
                      <span className="font-bold text-[#16A34A]">Within 24 Hours</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* =========================================================================
          KEY STATS / MUNICIPAL IMPACT TICKER
         ========================================================================= */}
      <section className="py-12 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#BAE6FD] hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">{s.value}</span>
                  <div className={`p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-[#0F172A] mb-0.5">{s.label}</h4>
                <p className="text-xs text-[#6B7280]">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE 3-STEP CIVIC ENGINE (HOW IT WORKS)
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-3.5 py-1 rounded-full">
              Seamless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-4 mb-3">
              How Civic Reporter Resolves Grievances
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563]">
              A modernized pipeline built to remove paperwork delays, bridge citizen reports directly to ward engineers, and maintain transparent public oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {workflowSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-7 sm:p-8 flex flex-col justify-between hover:border-[#BAE6FD] hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Top Accent Hover Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[#0284C7] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center font-bold">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-[#E5E7EB] group-hover:text-[#BAE6FD] transition-colors select-none">
                      {step.step}
                    </span>
                  </div>

                  <span className="inline-block text-[11px] font-semibold text-[#0284C7] uppercase tracking-wider mb-2">
                    {step.badge}
                  </span>

                  <h3 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#0284C7] transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-sm text-[#4B5563] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4F6] flex items-center text-xs font-semibold text-[#0284C7] group-hover:text-[#0369A1]">
                  <span>Learn more about Step {step.step}</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          ISSUE CATEGORIES OVERVIEW
         ========================================================================= */}
      <section className="py-20 sm:py-24 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-3.5 py-1 rounded-full">
                Supported Problem Types
              </span>
              <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mt-3">
                What Can You Report?
              </h2>
              <p className="text-sm text-[#4B5563] mt-1">
                Our vision engine is trained on thousands of municipal defect types.
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate('/submit')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors"
              >
                <span>Report an unlisted issue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((c) => (
              <motion.div
                key={c.id}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-xs hover:border-[#BAE6FD] hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.color }}
                    >
                      <c.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
                      {c.count}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] mb-1.5">{c.name}</h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">{c.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
                  <span className="text-[11px] text-[#6B7280]">AI Vision Model Supported</span>
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          ENTERPRISE BENTO GRID (TECHNOLOGY & TRUST)
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-3.5 py-1 rounded-full">
              Engineered For Accuracy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-4 mb-3">
              Built on Modern Civic Technology
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563]">
              Combining state-of-the-art computer vision, GIS boundary algorithms, and multilingual generative models for frictionless civic management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Vision Model */}
            <div className="md:col-span-2 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] p-7 sm:p-9 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mb-5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#0284C7] uppercase tracking-wider">Automated Defect Recognition</span>
                <h3 className="text-2xl font-bold text-[#0F172A] mt-1 mb-3">
                  Computer Vision & Anti-Spam Classification
                </h3>
                <p className="text-sm text-[#4B5563] leading-relaxed max-w-xl">
                  Trained deep-learning models scan uploaded images in seconds to identify defects, reject invalid inputs (e.g., screenshots, indoor photos, selfies), and calculate severity levels to prioritize emergency road repairs.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-[#E5E7EB] text-center">
                <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
                  <p className="text-lg font-bold text-[#0F172A]">98.2%</p>
                  <p className="text-[11px] text-[#6B7280]">Detection Accuracy</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
                  <p className="text-lg font-bold text-[#0F172A]">&lt; 1.2s</p>
                  <p className="text-[11px] text-[#6B7280]">Inference Time</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
                  <p className="text-lg font-bold text-[#16A34A]">Auto</p>
                  <p className="text-[11px] text-[#6B7280]">Spam Rejection</p>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Geo-boundary */}
            <div className="bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] p-7 sm:p-9 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center mb-5">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#16A34A] uppercase tracking-wider">Geospatial Intelligence</span>
                <h3 className="text-xl font-bold text-[#0F172A] mt-1 mb-3">
                  Precise GPS & Ward Mapping
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  Extracts EXIF metadata directly from camera captures, prevents duplicate issue submissions within proximity radius, and maps to the exact municipal ward.
                </p>
              </div>

              <div className="mt-6 p-3.5 bg-white rounded-xl border border-[#E5E7EB] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0" />
                <span className="text-xs font-medium text-[#334155]">Duplicate clustering prevents redundant work orders.</span>
              </div>
            </div>

            {/* Bento Card 3: Multilingual Drafting */}
            <div className="bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] p-7 sm:p-9 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center mb-5">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#D97706] uppercase tracking-wider">Legal Compliance</span>
                <h3 className="text-xl font-bold text-[#0F172A] mt-1 mb-3">
                  Formal Letter Generator
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  Generates ready-to-print official grievance petitions addressed directly to the responsible Commissioner or Sarpanch, downloadable as legal PDFs.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {['English', 'हिन्दी', 'मराठी', 'தமிழ்', 'తెలుగు', 'বাংলা'].map((lang) => (
                  <span key={lang} className="px-2 py-0.5 rounded text-[11px] bg-white border border-[#E5E7EB] text-[#4B5563] font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Bento Card 4: Accountability & Upvotes */}
            <div className="md:col-span-2 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] p-7 sm:p-9 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center mb-5">
                  <ThumbsUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wider">Democratic Oversight</span>
                <h3 className="text-2xl font-bold text-[#0F172A] mt-1 mb-3">
                  Community Upvotes & Citizen Reputation
                </h3>
                <p className="text-sm text-[#4B5563] leading-relaxed max-w-xl">
                  Empowering neighborhoods to vote on critical civic issues. High-priority upvoted reports appear at the top of the administrative queue, ensuring pressing community problems get resolved first.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-4 pt-4 border-t border-[#E5E7EB]">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-xs font-bold border-2 border-white">DP</div>
                  <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold border-2 border-white">SK</div>
                  <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-xs font-bold border-2 border-white">RM</div>
                  <div className="w-8 h-8 rounded-full bg-[#64748B] text-white flex items-center justify-center text-xs font-bold border-2 border-white">+5k</div>
                </div>
                <span className="text-xs font-medium text-[#4B5563]">Over 5,000 active citizens participating this month</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION BANNER
         ========================================================================= */}
      <section className="py-20 sm:py-24 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-md p-8 sm:p-14 text-center relative overflow-hidden">
            
            {/* Top decorative line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0284C7] via-[#38BDF8] to-[#0284C7]" />

            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-3.5 py-1 rounded-full mb-4">
              Get Involved Today
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
              Your City Needs Your Eyes. Let's Fix It Together.
            </h2>

            <p className="text-sm sm:text-base text-[#4B5563] max-w-2xl mx-auto mb-8 leading-relaxed">
              Join thousands of proactive citizens improving their local communities. Snap a photo of your neighborhood issue and submit it in under 60 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {!isAdmin && (
                <button
                  onClick={() => navigate('/submit')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Camera className="w-4 h-4" />
                  <span>Report an Issue Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#0F172A] font-semibold rounded-xl border border-[#D1D5DB] transition-all text-sm sm:text-base"
              >
                View Live Citizen Dashboard
              </button>
            </div>

            <p className="text-[11px] text-[#9CA3AF] mt-6">
              100% Free · Open Civic Platform · Secure & Privacy-First
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODERN SAAS FOOTER
         ========================================================================= */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12 text-[#6B7280]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                CR
              </div>
              <div>
                <span className="font-bold text-[#0F172A] text-base">Civic Reporter</span>
                <span className="block text-[11px] text-[#6B7280]">Smart Public Grievance Platform</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#4B5563]">
              <button onClick={() => navigate('/dashboard')} className="hover:text-[#0284C7] transition-colors">Citizen Portal</button>
              <button onClick={() => navigate('/submit')} className="hover:text-[#0284C7] transition-colors">Report Issue</button>
              <button onClick={() => navigate('/my-complaints')} className="hover:text-[#0284C7] transition-colors">Track Complaints</button>
              <button onClick={() => navigate('/admin')} className="hover:text-[#0284C7] transition-colors">Authority Login</button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
            <p>© {new Date().getFullYear()} Civic Reporter. Built for open citizen empowerment & clean governance.</p>
            <p className="text-center sm:text-right">
              For life-threatening emergencies, please dial emergency services immediately (112 / 100).
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
