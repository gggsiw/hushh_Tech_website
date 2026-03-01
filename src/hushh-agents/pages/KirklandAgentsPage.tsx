/**
 * Kirkland Agents — Listing Page
 * 
 * Major category filters (Finance, RIA, Insurance, etc.)
 * MCP badge on every agent card.
 * Follows KYC onboarding UI patterns.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import HushhTechBackHeader from '../../components/hushh-tech-back-header/HushhTechBackHeader';
import AgentAvatar from '../components/AgentAvatar';

const playfair = { fontFamily: "'Playfair Display', serif" };

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://ibsisfnjxeowvdtvgzff.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

/* ── Major Category Definitions ── */
interface MajorCategory {
  key: string;
  label: string;
  icon: string;
  keywords: string[];
}

const MAJOR_CATEGORIES: MajorCategory[] = [
  {
    key: 'finance',
    label: 'Finance',
    icon: 'account_balance',
    keywords: ['financial', 'accountant', 'tax', 'bank', 'credit union', 'bookkeeping', 'payroll', 'mortgage', 'loan', 'wealth'],
  },
  {
    key: 'ria',
    label: 'RIA',
    icon: 'trending_up',
    keywords: ['investment', 'advisor', 'portfolio', 'asset management', 'securities', 'hedge fund', 'mutual fund', 'brokerage', 'fiduciary'],
  },
  {
    key: 'insurance',
    label: 'Insurance',
    icon: 'shield',
    keywords: ['insurance', 'life insurance', 'health insurance', 'auto insurance', 'property insurance', 'underwriting'],
  },
  {
    key: 'real-estate',
    label: 'Real Estate',
    icon: 'home_work',
    keywords: ['real estate', 'property', 'realtor', 'housing', 'apartment', 'commercial real estate', 'land'],
  },
  {
    key: 'health',
    label: 'Health',
    icon: 'local_hospital',
    keywords: ['doctor', 'dentist', 'health', 'medical', 'chiropractic', 'optometrist', 'pharmacy', 'clinic', 'hospital', 'therapy', 'mental health', 'veterinar'],
  },
  {
    key: 'legal',
    label: 'Legal',
    icon: 'gavel',
    keywords: ['lawyer', 'legal', 'attorney', 'law firm', 'notary', 'immigration', 'divorce', 'criminal', 'estate planning'],
  },
  {
    key: 'technology',
    label: 'Tech',
    icon: 'code',
    keywords: ['it ', 'software', 'web design', 'technology', 'computer', 'internet', 'data', 'cloud', 'cyber', 'telecom'],
  },
  {
    key: 'home-services',
    label: 'Home',
    icon: 'construction',
    keywords: ['plumb', 'electric', 'contractor', 'landscap', 'roofing', 'paint', 'cleaning', 'handyman', 'hvac', 'pest', 'locksmith', 'moving'],
  },
  {
    key: 'food',
    label: 'Food',
    icon: 'restaurant',
    keywords: ['restaurant', 'cafe', 'coffee', 'bar', 'bakery', 'pizza', 'food', 'catering', 'grocery', 'deli', 'brewery'],
  },
  {
    key: 'auto',
    label: 'Auto',
    icon: 'directions_car',
    keywords: ['auto', 'car', 'vehicle', 'mechanic', 'tire', 'body shop', 'towing', 'oil change', 'transmission'],
  },
  {
    key: 'education',
    label: 'Education',
    icon: 'school',
    keywords: ['school', 'tutor', 'training', 'education', 'university', 'college', 'preschool', 'daycare', 'child care'],
  },
  {
    key: 'beauty',
    label: 'Beauty',
    icon: 'spa',
    keywords: ['salon', 'spa', 'massage', 'beauty', 'hair', 'nail', 'skin', 'barber', 'cosmetic', 'waxing'],
  },
];

/** Check if an agent matches a major category */
const agentMatchesMajor = (categories: string[], major: MajorCategory): boolean => {
  if (!categories?.length) return false;
  const joined = categories.join(' ').toLowerCase();
  return major.keywords.some((kw) => joined.includes(kw.toLowerCase()));
};

/** Agent type */
interface KirklandAgent {
  id: string;
  name: string;
  alias: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  avg_rating: number | null;
  review_count: number;
  categories: string[];
  is_closed: boolean;
  photo_url: string | null;
}

/** Star rating row */
const Stars: React.FC<{ rating: number | null }> = ({ rating }) => {
  if (!rating) return <span className="text-[11px] text-gray-400">No rating</span>;
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-[14px] ${
            i < full ? 'text-amber-400' : 'text-gray-200'
          }`}
          style={{ fontVariationSettings: i < full ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
      <span className="text-[11px] text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

/** Individual agent card with MCP badge */
const AgentCard: React.FC<{ agent: KirklandAgent; featured?: boolean }> = ({ agent, featured }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/hushh-agents/kirkland/${agent.id}`)}
      className={`text-left w-full border rounded-2xl p-4 transition-all active:scale-[0.98] ${
        featured
          ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
          : 'border-gray-200/60 bg-white hover:border-gray-300'
      }`}
      aria-label={`View ${agent.name}`}
    >
      {/* Top row: avatar + name + MCP badge */}
      <div className="flex items-center gap-3">
        <AgentAvatar name={agent.name} size="md" featured={featured} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
            {agent.name}
          </p>
          {agent.city && (
            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[12px]">location_on</span>
              {agent.city}{agent.state ? `, ${agent.state}` : ''}
            </p>
          )}
        </div>

        {/* MCP Badge */}
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded-full uppercase tracking-wider border border-emerald-200/60">
          MCP
        </span>

        {featured && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full uppercase tracking-wider">
            Top
          </span>
        )}
        <span className="material-symbols-outlined text-gray-300 text-[18px]">
          chevron_right
        </span>
      </div>

      {/* Rating */}
      <div className="mt-2.5">
        <Stars rating={agent.avg_rating} />
        {agent.review_count > 0 && (
          <span className="text-[10px] text-gray-400 ml-0.5">
            ({agent.review_count})
          </span>
        )}
      </div>

      {/* Categories */}
      {agent.categories?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {agent.categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full font-medium"
            >
              {cat}
            </span>
          ))}
          {agent.categories.length > 2 && (
            <span className="text-[10px] text-gray-300 font-medium">
              +{agent.categories.length - 2}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

const KirklandAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<KirklandAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('kirkland_agents')
        .select('id, name, alias, phone, city, state, avg_rating, review_count, categories, is_closed, photo_url')
        .eq('is_closed', false)
        .order('avg_rating', { ascending: false, nullsFirst: false });

      if (!error && data) setAgents(data);
      setIsLoading(false);
    };
    fetchAgents();
  }, []);

  // Count agents per major category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MAJOR_CATEGORIES.forEach((mc) => {
      counts[mc.key] = agents.filter((a) => agentMatchesMajor(a.categories, mc)).length;
    });
    return counts;
  }, [agents]);

  // Top 10
  const topAgents = useMemo(() => {
    return agents
      .filter(a => a.avg_rating && a.avg_rating > 0 && a.review_count > 0)
      .slice(0, 10);
  }, [agents]);

  // Filtered
  const filteredAgents = useMemo(() => {
    let result = agents;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.categories?.some(c => c.toLowerCase().includes(q))
      );
    }

    // Major category filter
    if (selectedMajor) {
      const major = MAJOR_CATEGORIES.find((m) => m.key === selectedMajor);
      if (major) {
        result = result.filter((a) => agentMatchesMajor(a.categories, major));
      }
    }

    return result;
  }, [agents, searchQuery, selectedMajor]);

  // Loading
  if (isLoading) {
    return (
      <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
        <HushhTechBackHeader onBackClick={() => navigate('/hushh-agents')} rightLabel="FAQs" />
        <main className="px-6 flex-grow max-w-md mx-auto w-full pb-48 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <span className="material-symbols-outlined text-gray-400">location_city</span>
            </div>
            <p className="text-[13px] text-gray-400 font-light">Loading agents...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
      <HushhTechBackHeader onBackClick={() => navigate('/hushh-agents')} rightLabel="FAQs" />

      <main className="px-6 flex-grow max-w-md mx-auto w-full pb-48">

        {/* ── Title Section ── */}
        <section className="pt-8 pb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2 font-medium">
            Agent Directory
          </p>
          <h1
            className="text-[2rem] leading-[1.1] font-normal text-black tracking-tight font-serif"
            style={playfair}
          >
            Kirkland <br />
            <span className="text-gray-400 italic font-light">Agents</span>
          </h1>
          <p className="text-gray-500 text-[13px] font-light mt-3 leading-relaxed">
            {agents.length} agents with MCP endpoints. Filter by category.
          </p>
        </section>

        {/* ── Search Bar ── */}
        <section className="pb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200/60 rounded-2xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hushh-blue/20 focus:border-hushh-blue/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-[18px] text-gray-400">close</span>
              </button>
            )}
          </div>
        </section>

        {/* ── Major Category Filter Grid ── */}
        <section className="pb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-medium">
            Filter by Category
          </p>
          <div className="grid grid-cols-4 gap-2">
            {/* All button */}
            <button
              onClick={() => setSelectedMajor(null)}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all ${
                !selectedMajor
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200/60 hover:border-gray-300'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">apps</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider">All</span>
              <span className={`text-[8px] font-medium ${!selectedMajor ? 'text-gray-300' : 'text-gray-400'}`}>
                {agents.length}
              </span>
            </button>

            {MAJOR_CATEGORIES.map((mc) => {
              const count = categoryCounts[mc.key] || 0;
              if (count === 0) return null;
              const isActive = selectedMajor === mc.key;
              return (
                <button
                  key={mc.key}
                  onClick={() => setSelectedMajor(isActive ? null : mc.key)}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 border-gray-200/60 hover:border-gray-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{mc.icon}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider">{mc.label}</span>
                  <span className={`text-[8px] font-medium ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Top Recommended ── */}
        {!searchQuery && !selectedMajor && topAgents.length > 0 && (
          <section className="pb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-400 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              Top Recommended
            </p>
            <div className="space-y-3">
              {topAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} featured />
              ))}
            </div>
          </section>
        )}

        {/* ── All Agents / Search Results ── */}
        <section className="pb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-medium">
            {searchQuery || selectedMajor
              ? `Results · ${filteredAgents.length}`
              : `All Agents · ${agents.length}`}
          </p>

          {filteredAgents.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-gray-200 text-[40px] mb-3 block">
                search_off
              </span>
              <p className="text-gray-500 text-[13px] font-light">No agents found</p>
              <p className="text-gray-400 text-[11px] font-light mt-1">Try a different category or search</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default KirklandAgentsPage;
