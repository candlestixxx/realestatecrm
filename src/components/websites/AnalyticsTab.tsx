'use client';

import { Eye, UserCheck, Percent, MapPin, TrendingUp, Award } from 'lucide-react';

const COUNTY_DATA = [
  { name: 'Macomb County', visits: 1240, leads: 118, rate: '9.5%' },
  { name: 'Oakland County', visits: 980, leads: 95, rate: '9.7%' },
  { name: 'Wayne County', visits: 850, leads: 62, rate: '7.3%' },
  { name: 'St. Clair County', visits: 410, leads: 32, rate: '7.8%' },
];

export default function AnalyticsTab() {
  return (
    <div className="space-y-8 text-foreground">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-black tracking-wider block">Total Visual Visits</span>
            <span className="text-3xl font-black text-foreground">3,480</span>
            <p className="text-[10px] text-green-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2% from last week
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/15">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-black tracking-wider block">Lead Registrations</span>
            <span className="text-3xl font-black text-foreground">307</span>
            <p className="text-[10px] text-green-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +18.5% new sync records
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/15">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-black tracking-wider block">Visit-to-Lead Rate</span>
            <span className="text-3xl font-black text-foreground">8.82%</span>
            <p className="text-[10px] text-indigo-500 font-bold flex items-center gap-0.5">
              <Award className="w-3.5 h-3.5" /> Exceeding team targets (8.0%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/15">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Breakout metrics layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Counties Breakout Table */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-foreground">Hyper-Local County Campaigns</h3>
            <p className="text-xs text-muted-foreground">Performance data across target Michigan listing counties.</p>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/30 font-bold uppercase tracking-wider text-[10px] text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="px-4 py-3">County Zone</th>
                  <th className="px-4 py-3">Page Visits</th>
                  <th className="px-4 py-3">Sync Leads</th>
                  <th className="px-4 py-3 text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                {COUNTY_DATA.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {row.name}
                    </td>
                    <td className="px-4 py-3">{row.visits.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.leads}</td>
                    <td className="px-4 py-3 text-right text-indigo-500 font-extrabold">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic visual graph mock */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-foreground">Lead Generation Growth</h3>
            <p className="text-xs text-muted-foreground">Historical leads captured over the current billing cycle.</p>
          </div>
          
          <div className="h-48 flex items-end gap-2 pt-6 border-b border-border/40 pb-2">
            <div className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-t-lg h-[40%] transition-all relative group cursor-help">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover border border-border px-1.5 py-0.5 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity">Week 1</span>
            </div>
            <div className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-t-lg h-[55%] transition-all relative group cursor-help">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover border border-border px-1.5 py-0.5 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity">Week 2</span>
            </div>
            <div className="flex-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-t-lg h-[70%] transition-all relative group cursor-help">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover border border-border px-1.5 py-0.5 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity">Week 3</span>
            </div>
            <div className="flex-1 bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 rounded-t-lg h-[95%] transition-all relative group cursor-help shadow-lg">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover border border-border px-1.5 py-0.5 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity">Week 4</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-black pt-2 uppercase tracking-widest">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>

      </div>
    </div>
  );
}
