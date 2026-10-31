import * as React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Activity, 
  Download, 
  Share2, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Calendar,
  Layers,
  Hand,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { usePresentationStore } from '@/stores/presentationStore';
import { useAppStore } from '@/stores/appStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Pacing comparison dataset
const slidePacingData = [
  { name: 'Slide 1 (Intro)', actual: 48, target: 45, overrun: 3 },
  { name: 'Slide 2 (Problem)', actual: 68, target: 60, overrun: 8 },
  { name: 'Slide 3 (Arch)', actual: 98, target: 75, overrun: 23 },
  { name: 'Slide 4 (State Mach)', actual: 72, target: 70, overrun: 2 },
  { name: 'Slide 5 (Vision)', actual: 80, target: 80, overrun: 0 },
  { name: 'Slide 6 (Results)', actual: 54, target: 50, overrun: 4 },
  { name: 'Slide 7 (Roadmap)', actual: 40, target: 45, overrun: -5 },
];

// Gesture frequency distribution
const gestureDistData = [
  { name: 'Swipe Next', value: 28, color: '#0284c7' },
  { name: 'Swipe Prev', value: 12, color: '#38bdf8' },
  { name: 'Virtual Laser', value: 34, color: '#ef4444' },
  { name: 'Air Drawing', value: 18, color: '#8b5cf6' },
  { name: 'Palm Arming', value: 22, color: '#10b981' },
  { name: 'Fist Pause', value: 8, color: '#f59e0b' },
];

// Rehearsal progress trend across recent runs
const sessionTrendData = [
  { session: 'Run #1', accuracy: 88.4, latencyMs: 24.1, wpm: 148 },
  { session: 'Run #2', accuracy: 91.2, latencyMs: 21.0, wpm: 142 },
  { session: 'Run #3', accuracy: 93.6, latencyMs: 18.5, wpm: 138 },
  { session: 'Run #4', accuracy: 95.8, latencyMs: 16.9, wpm: 135 },
  { session: 'Run #5', accuracy: 97.4, latencyMs: 15.8, wpm: 132 },
];

// Real-time hardware performance timeline
const hardwarePerfData = [
  { time: '0:00', fps: 59, latency: 15 },
  { time: '1:00', fps: 60, latency: 14 },
  { time: '2:00', fps: 58, latency: 17 },
  { time: '3:00', fps: 57, latency: 18 },
  { time: '4:00', fps: 60, latency: 15 },
  { time: '5:00', fps: 59, latency: 16 },
  { time: '6:00', fps: 60, latency: 14 },
];

const pastSessions = [
  { id: 'sess-01', title: 'Senior Design Defense Dry Run', date: 'Oct 24, 2026', duration: '6m 10s', score: 96, gestures: 122, status: 'Completed' },
  { id: 'sess-02', title: 'Faculty Pre-Screening Demo', date: 'Oct 23, 2026', duration: '5m 40s', score: 94, gestures: 98, status: 'Completed' },
  { id: 'sess-03', title: 'Pacing & Laser Calibration', date: 'Oct 22, 2026', duration: '4m 15s', score: 89, gestures: 64, status: 'Completed' },
];

export function AnalyticsView() {
  const { presentations, currentPresentationId } = usePresentationStore();
  const { setCurrentView } = useAppStore();
  const { addToast } = useToastStore();

  const currentDeck = presentations.find((p) => p.id === currentPresentationId) || presentations[0];

  const handleExportTelemetry = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({
        deck: currentDeck?.title,
        exportDate: new Date().toISOString(),
        pacing: slidePacingData,
        gestureDistribution: gestureDistData,
        trend: sessionTrendData,
        performance: hardwarePerfData,
      }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `slidex_analytics_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      title: 'Analytics Exported',
      description: 'Telemetry log and session benchmarks downloaded as JSON.',
      type: 'success',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Performance & Practice Insights
            </h1>
            <Badge variant="default" className="gap-1 font-mono text-[10px]">
              <BarChart3 className="h-3 w-3" />
              Session Telemetry
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Longitudinal gesture accuracy, pacing histograms, and frame-rate diagnostics across presentation sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportTelemetry}
            className="h-8 gap-1.5 text-xs border-border"
          >
            <Download className="h-3.5 w-3.5" />
            Export Telemetry
          </Button>
          <Button
            size="sm"
            onClick={() => setCurrentView('rehearsal')}
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Rehearsal Coach
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Avg Gesture Confidence</span>
              <div className="text-2xl font-bold text-foreground font-mono">97.4%</div>
              <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +3.8% over 5 runs
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Hand className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mean Gesture Latency</span>
              <div className="text-2xl font-bold text-foreground font-mono">15.8 ms</div>
              <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-0.5">
                <Zap className="h-3 w-3" /> Sub-50ms target met
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pacing Cadence</span>
              <div className="text-2xl font-bold text-foreground font-mono">132 WPM</div>
              <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" /> Ideal defense tempo
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pipeline Frame Rate</span>
              <div className="text-2xl font-bold text-foreground font-mono">59.2 FPS</div>
              <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-0.5">
                <Layers className="h-3 w-3" /> WebGL accelerated
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Slide Pacing Bar Chart & Gesture Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Slide Duration Actual vs Target (7 cols) */}
        <Card className="lg:col-span-7 bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Slide Pacing Audit (Seconds Spent vs Target)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Identifies bottlenecks where presentation content needs condensing.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {currentDeck?.title || 'Selected Deck'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slidePacingData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    unit="s"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '8px', 
                      fontSize: '12px',
                      color: '#f8fafc' 
                    }} 
                  />
                  <Bar dataKey="target" fill="#334155" radius={[4, 4, 0, 0]} name="Target (s)" />
                  <Bar dataKey="actual" fill="#0284c7" radius={[4, 4, 0, 0]} name="Actual (s)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right: Gesture Distribution (5 cols) */}
        <Card className="lg:col-span-5 bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-emerald-500" />
              Interaction Gesture Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Proportion of navigational vs annotative interactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gestureDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {gestureDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '8px', 
                      fontSize: '12px',
                      color: '#f8fafc' 
                    }} 
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Accuracy & Latency Multi-Session Learning Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              Gesture Accuracy & Latency Learning Curve
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Tracks precision and execution speed improvement across rehearsal runs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="session" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} domain={[80, 100]} unit="%" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '8px', 
                      fontSize: '12px',
                      color: '#f8fafc' 
                    }} 
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#accGrad)" name="Accuracy (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Hardware Diagnostics */}
        <Card className="lg:col-span-4 bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Runtime FPS Stability
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              60 FPS lock verifying browser zero-drop rendering.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hardwarePerfData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="time" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} domain={[50, 65]} unit=" fps" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '8px', 
                      fontSize: '12px',
                      color: '#f8fafc' 
                    }} 
                  />
                  <Line type="monotone" dataKey="fps" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="FPS" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Practice Runs Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Recent Rehearsal Archives
        </h3>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-4">Session Title</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Gestures Executed</th>
                  <th className="py-2.5 px-4">Defense Score</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pastSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{sess.title}</td>
                    <td className="py-3 px-4 text-muted-foreground">{sess.date}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{sess.duration}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{sess.gestures}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" className="font-mono text-[10px]">
                        {sess.score}/100
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentView('rehearsal')}
                        className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        Review Coach
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
