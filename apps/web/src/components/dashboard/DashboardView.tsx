import * as React from 'react';
import { 
  Play, 
  Upload, 
  Sparkles, 
  Video, 
  Camera, 
  CameraOff, 
  Layers, 
  Clock, 
  FileText, 
  CheckCircle2, 
  SlidersHorizontal, 
  ChevronRight, 
  Plus, 
  Hand, 
  ShieldCheck, 
  Zap, 
  Mic2,
  Share2,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { usePresentationStore, type Presentation } from '@/stores/presentationStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

export function DashboardView() {
  const { setCurrentView, setActivePresentationId, gestureState, currentGesture, dominantHand } = useAppStore();
  const { presentations, setCurrentPresentation, createPresentation, addFullPresentation } = usePresentationStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = React.useState<'all' | 'recent' | 'favorites'>('all');
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [showAiModal, setShowAiModal] = React.useState(false);
  const [showCameraTestModal, setShowCameraTestModal] = React.useState(false);
  const [aiTopic, setAiTopic] = React.useState('');
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Quick camera preview test state
  const [cameraActive, setCameraActive] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [testGestureFeedback, setTestGestureFeedback] = React.useState('Waiting for hand...');

  const handleStartPresenting = (deckId: string) => {
    setCurrentPresentation(deckId);
    setActivePresentationId(deckId);
    setCurrentView('presenter');
    addToast({
      title: 'Presentation Started',
      description: 'Hold an open palm to the camera for 1 second to activate gesture controls.',
      type: 'gesture',
    });
  };

  const handleStartRehearsal = (deckId: string) => {
    setCurrentPresentation(deckId);
    setActivePresentationId(deckId);
    setCurrentView('rehearsal');
  };

  const startCameraTest = async () => {
    setShowCameraTestModal(true);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setTestGestureFeedback('Camera active! Raise your hand to test.');
    } catch (err) {
      setTestGestureFeedback('Camera access denied or unavailable.');
    }
  };

  const stopCameraTest = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setShowCameraTestModal(false);
  };

  const handleGenerateAiDeck = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingAi(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/ai/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          num_slides: 5,
          target_audience: 'Faculty Committee & Senior Engineers',
          tone: 'Authoritative, Academic & Engaging',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newDeckId = `ai-deck-${Date.now()}`;
        const newDeck: Presentation = {
          id: newDeckId,
          title: data.title || aiTopic,
          description: data.description || `AI-generated presentation on ${aiTopic}`,
          category: data.category || 'Artificial Intelligence',
          author: 'GestureDeck AI Assistant',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          theme: 'dark',
          slides: data.slides.map((s: any, idx: number) => ({
            id: `${newDeckId}-s${idx + 1}`,
            slideNumber: s.slide_number || idx + 1,
            title: s.title,
            subtitle: s.subtitle,
            estimatedDurationSeconds: s.estimated_duration_seconds || 60,
            speakerNotes: s.speaker_notes,
            annotations: [],
            elements: [
              { id: `el-h-${idx}`, type: 'heading', content: s.title },
              { id: `el-sub-${idx}`, type: 'text', content: s.subtitle },
              { id: `el-bl-${idx}`, type: 'bullet_list', content: s.bullet_points },
            ],
          })),
        };

        addFullPresentation(newDeck);
        setIsGeneratingAi(false);
        setShowAiModal(false);
        setAiTopic('');
        addToast({
          title: 'AI Presentation Ready',
          description: `Generated 5 comprehensive slides with presenter cues for "${data.title}".`,
          type: 'success',
        });
        handleStartPresenting(newDeckId);
        return;
      }
    } catch {
      // Fallback to local offline generator
    }

    const fallbackId = createPresentation(
      aiTopic,
      `AI-assisted slide deck with structured talking points and presenter notes.`
    );
    setIsGeneratingAi(false);
    setShowAiModal(false);
    setAiTopic('');
    addToast({
      title: 'Presentation Created',
      description: `Generated slides for "${aiTopic}".`,
      type: 'success',
    });
    handleStartPresenting(fallbackId);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/presentations/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const parsed = await res.json();
        const uploadedDeck: Presentation = {
          id: parsed.id,
          title: parsed.title,
          description: parsed.description,
          category: parsed.category || 'Uploaded Presentation',
          author: 'Uploaded Document',
          createdAt: parsed.created_at || new Date().toISOString(),
          updatedAt: parsed.updated_at || new Date().toISOString(),
          theme: 'dark',
          slides: parsed.slides.map((s: any) => ({
            id: s.id,
            slideNumber: s.slide_number,
            title: s.title,
            subtitle: s.subtitle || '',
            speakerNotes: s.speaker_notes || '',
            estimatedDurationSeconds: s.estimated_duration_seconds || 60,
            annotations: [],
            elements: s.elements || [
              { id: `el-${s.slide_number}`, type: 'heading', content: s.title },
            ],
          })),
        };
        addFullPresentation(uploadedDeck);
        setShowUploadModal(false);
        setIsUploading(false);
        addToast({
          title: 'Document Converted',
          description: `Imported "${parsed.title}" with ${parsed.slides.length} slides.`,
          type: 'success',
        });
        return;
      }
    } catch {
      // Fallback
    }

    const localId = createPresentation(
      file.name.replace(/\.[^/.]+$/, ''),
      `Imported from local file: ${file.name}`
    );
    setShowUploadModal(false);
    setIsUploading(false);
    addToast({
      title: 'File Imported',
      description: `Ready to present ${file.name}.`,
      type: 'success',
    });
    handleStartPresenting(localId);
  };

  const visualGestures = [
    {
      title: 'Open Palm',
      instruction: 'Hold steady for 1s',
      action: 'Arms gesture control',
      badge: 'Start here',
      icon: '✋',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Swipe Hand',
      instruction: 'Glide left or right',
      action: 'Next / previous slide',
      badge: 'Navigate',
      icon: '👉',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    },
    {
      title: 'Index Finger Point',
      instruction: 'Point towards screen',
      action: 'Virtual laser pointer',
      badge: 'Focus',
      icon: '👆',
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    },
    {
      title: 'Pinch & Drag',
      instruction: 'Pinch thumb & index',
      action: 'Draw annotations in air',
      badge: 'Annotate',
      icon: '🤏',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    },
    {
      title: 'Closed Fist',
      instruction: 'Hold fist for 1s',
      action: 'Pauses gesture controls',
      badge: 'Safety lock',
      icon: '✊',
      color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    },
    {
      title: 'Palm Wipe',
      instruction: 'Sweep flat hand across',
      action: 'Clears all air-drawings',
      badge: 'Clean up',
      icon: '👋',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-in fade-in-0 duration-200">
      {/* Friendly Welcome & Hero Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur-sm px-3 py-1 text-xs text-muted-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">Touchless Presentation System</span>
            <span className="text-border">•</span>
            <span>Webcam Ready</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Deliver presentations hands-free with natural hand gestures.
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Move between slides, highlight key points with a virtual laser, and draw annotations in the air using your webcam. No clickers or hardware remotes required.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Button
              size="default"
              onClick={() => handleStartPresenting('deck-1')}
              className="h-10 px-5 gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
              Present Final Defense
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={startCameraTest}
              className="h-10 px-4 gap-2 text-sm border-border bg-background hover:bg-muted"
            >
              <Camera className="h-4 w-4 text-primary" />
              Quick Camera Test
            </Button>

            <Button
              variant="ghost"
              size="default"
              onClick={() => setShowAiModal(true)}
              className="h-10 px-4 gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Create with AI
            </Button>
          </div>
        </div>

        {/* Decorative subtle visual corner */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none select-none hidden lg:block">
          <Hand className="w-64 h-64 text-foreground" />
        </div>
      </div>

      {/* Presentation Library Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">My Presentations</h2>
            <p className="text-xs text-muted-foreground">Select a deck to present or rehearse with the AI coach</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload PDF / PPTX
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAiModal(true)}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              New Presentation
            </Button>
          </div>
        </div>

        {/* Slide Deck Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {presentations.map((deck, index) => (
            <Card
              key={deck.id}
              className="group relative flex flex-col justify-between overflow-hidden border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200"
            >
              {/* Visual Presentation Slide Thumbnail Cover */}
              <div 
                className="relative aspect-[16/9] w-full p-6 flex flex-col justify-between overflow-hidden border-b border-border/60 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white cursor-pointer"
                onClick={() => handleStartPresenting(deck.id)}
              >
                {/* Header bar of slide thumbnail */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm text-zinc-300">
                    {deck.category}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {deck.slides.length} Slides
                  </span>
                </div>

                {/* Center Title Content */}
                <div className="z-10 space-y-1.5 my-auto">
                  <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-primary-foreground transition-colors leading-snug">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {deck.description}
                  </p>
                </div>

                {/* Bottom metadata strip */}
                <div className="flex items-center justify-between z-10 text-[11px] text-zinc-400 border-t border-white/10 pt-3">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    ~{deck.slides.length * 2} mins delivery
                  </span>
                  <span className="flex items-center gap-1 text-primary-foreground font-medium group-hover:translate-x-0.5 transition-transform">
                    Click to present <ChevronRight className="h-3 w-3" />
                  </span>
                </div>

                {/* Subtle gradient glow in thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Deck Action Card Footer */}
              <CardFooter className="flex items-center justify-between p-4 bg-card">
                <span className="text-xs text-muted-foreground">
                  Updated {formatDate(deck.updatedAt)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentPresentation(deck.id);
                      setActivePresentationId(deck.id);
                      setCurrentView('editor');
                    }}
                    className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartRehearsal(deck.id)}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Mic2 className="h-3.5 w-3.5 text-primary" />
                    Rehearse
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStartPresenting(deck.id)}
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Present
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Visual Gesture Guide for Presenters */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">How Hand Gestures Work</h2>
            <p className="text-xs text-muted-foreground">Simple gestures you can use during any presentation</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={startCameraTest}
            className="text-xs text-primary gap-1"
          >
            Practice Gestures
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {visualGestures.map((item, index) => (
            <div
              key={index}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/40 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl select-none">{item.icon}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${item.color}`}>
                  {item.badge}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{item.instruction}</p>
              </div>
              <div className="text-[11px] font-medium text-primary border-t border-border/50 pt-2">
                {item.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Safety Guarantee Card */}
      <div className="rounded-xl border border-border bg-card/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">100% On-Device & Private</h4>
            <p className="text-xs text-muted-foreground">
              Your camera feed never leaves your device. Hand recognition runs locally in the browser with zero cloud video transmission.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px] font-mono shrink-0">
          Client-Side Only
        </Badge>
      </div>

      {/* Upload Presentation Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Presentation</DialogTitle>
            <DialogDescription>
              Upload your PowerPoint (.pptx) or PDF (.pdf) presentation deck.
            </DialogDescription>
          </DialogHeader>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pptx,.pdf"
            className="hidden"
          />

          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3 hover:border-primary/50 transition-colors cursor-pointer bg-muted/20"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              {isUploading ? (
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">
                {isUploading ? 'Parsing presentation & extracting slides...' : 'Click to select or drag & drop'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PowerPoint (.pptx) or Adobe PDF (.pdf) up to 50MB
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isUploading ? 'Converting...' : 'Select File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create with AI Modal */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Generate Deck with AI
            </DialogTitle>
            <DialogDescription>
              Enter a presentation topic. GestureDeck will generate slides, outline, and speaker notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground">Presentation Topic or Outline</label>
            <Input
              placeholder="e.g. Future of Renewable Energy & Smart Grids"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiDeck()}
            />
            <p className="text-[11px] text-muted-foreground">
              Generates 5 ready-to-present slides with speaker notes and bullet points.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiModal(false)}>Cancel</Button>
            <Button 
              onClick={handleGenerateAiDeck}
              disabled={!aiTopic.trim() || isGeneratingAi}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGeneratingAi ? 'Generating Slides...' : 'Generate Presentation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Camera & Gesture Test Modal */}
      <Dialog open={showCameraTestModal} onOpenChange={(open) => !open && stopCameraTest()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Webcam & Gesture Check
            </DialogTitle>
            <DialogDescription>
              Ensure your webcam sees your hand clearly before presenting.
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-950 border border-border flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover transform -scale-x-100"
              muted
              playsInline
            />
            {/* Overlay feedback */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-xs text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{testGestureFeedback}</span>
            </div>

            <div className="absolute bottom-3 inset-x-3 bg-black/70 backdrop-blur-sm p-2 rounded text-center text-[11px] text-zinc-300">
              Hold an open palm facing the camera for 1 second to arm gesture control.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={stopCameraTest}>Close Test</Button>
            <Button onClick={() => {
              stopCameraTest();
              handleStartPresenting('deck-1');
            }} className="bg-primary text-primary-foreground">
              Looks Good, Start Presenting!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
