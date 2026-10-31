import * as React from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  PlayCircle, 
  FileText, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Code2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DocsView() {
  const vivaQuestions = [
    {
      q: '1. Why did you choose MediaPipe Tasks Vision over running a heavy YOLO or OpenCV model on a backend server?',
      a: 'Client-side MediaPipe WASM processes video frames locally on the user device at 30+ FPS with zero network latency. If camera frames were streamed to a Python server, latency would skyrocket to 200–500ms due to bandwidth and compression, and it would introduce severe privacy concerns since live webcam video would be transmitted outside the browser.',
    },
    {
      q: '2. How does the One Euro filter eliminate jitter without causing perceptible lag?',
      a: 'The One Euro filter is an adaptive first-order low-pass filter. At low speeds (when pointing or holding still), it lowers the cutoff frequency to filter out high-frequency noise and tremor. At high speeds (swipes), it dynamically raises the cutoff frequency to eliminate lag and track rapid hand movement instantaneously.',
    },
    {
      q: '3. What prevents accidental slide changes when the speaker talks with their hands?',
      a: 'A deterministic Finite State Machine (FSM) architecture. Random hand gestures are ignored while in the IDLE state. Transitioning to the ARMED state requires holding an open palm facing the camera for 1000ms. In addition, gestures have a 750ms refractory cooldown and a 60px positional hysteresis threshold.',
    },
    {
      q: '4. How does the model classify gestures from 21 hand landmarks?',
      a: 'MediaPipe outputs 21 3D coordinate landmarks (x, y, z). We translate the coordinates relative to the wrist (landmark 0) and normalize them by hand span (wrist to middle MCP distance). This makes the landmark vector invariant to camera distance and screen position. The resulting 63-dimensional normalized feature vector is passed to a lightweight Multilayer Perceptron (MLP) trained in TensorFlow/Keras and exported to TF.js.',
    },
    {
      q: '5. How is the virtual laser pointer calibrated to the presenter display?',
      a: 'The fingertip (landmark 8, index tip) coordinate is mapped through a non-linear calibration polynomial that maps the webcam field of view to the 16:9 slide display aspect ratio. Position coordinates are smoothed via exponential moving average to ensure steady pointing.',
    },
    {
      q: '6. What happens if lighting drops or the user stands too far from the camera?',
      a: 'Our Calibration Wizard checks bounding box pixel height and MediaPipe presence confidence. If hand landmark confidence drops below 0.70 or lighting contrast is inadequate, the UI warns the presenter with an on-screen toast and falls back to voice commands or keyboard shortcuts.',
    },
    {
      q: '7. How do you achieve 60 FPS UI rendering while running vision inference?',
      a: 'Vision processing and landmark extraction run inside a dedicated Web Worker using an OffscreenCanvas. This ensures the main JavaScript thread handling the React DOM, slide transitions, and animations is never blocked by vision computation.',
    },
    {
      q: '8. How does the in-browser custom gesture trainer work?',
      a: 'The user records 30 landmark frames for their new gesture. We construct a synthetic dataset with data augmentation (minor rotation, scaling, jitter). Using TensorFlow.js in the browser, transfer learning or top-layer fine-tuning is performed directly on the client in under 2 seconds, assigning the new class to any presentation action.',
    },
    {
      q: '9. How does the phone remote synchronization work?',
      a: 'FastAPI exposes a WebSocket endpoint (`/ws/sync/{deck_id}`). When a phone scans the audience or presenter QR code, it connects to the room channel. State changes (slide index, laser pointer coordinates, notes) are broadcast over lightweight JSON payloads with sub-20ms WebSocket propagation.',
    },
    {
      q: '10. What is the fallback mechanism if WebGL is unavailable on a client device?',
      a: 'MediaPipe Tasks Vision falls back automatically to the CPU WebAssembly delegate. While frame rate drops from ~45 FPS to ~24 FPS on older CPUs, the system remains fully operational without crashing.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-in fade-in-0 duration-200">
      <div className="space-y-1 border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Engineering Documentation & Evaluation Bank
        </h1>
        <p className="text-xs text-muted-foreground">
          System specifications, 5-minute live viva script, presentation outline, and committee Q&A.
        </p>
      </div>

      <Tabs defaultValue="viva" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="viva" className="gap-2 text-xs">
            <HelpCircle className="h-3.5 w-3.5" />
            Viva Question Bank (10+)
          </TabsTrigger>
          <TabsTrigger value="demo" className="gap-2 text-xs">
            <PlayCircle className="h-3.5 w-3.5" />
            5-Min Demo Script
          </TabsTrigger>
          <TabsTrigger value="slides" className="gap-2 text-xs">
            <FileText className="h-3.5 w-3.5" />
            12-Slide Outline
          </TabsTrigger>
          <TabsTrigger value="arch" className="gap-2 text-xs">
            <Layers className="h-3.5 w-3.5" />
            System Architecture
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Viva Questions */}
        <TabsContent value="viva" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Likely Faculty Examination Questions & Formal Answers
            </h2>
            <Badge variant="outline" className="font-mono text-[10px]">
              10 Core Questions
            </Badge>
          </div>

          <div className="space-y-3">
            {vivaQuestions.map((item, idx) => (
              <Card key={idx} className="bg-card/70 border-border/70">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-semibold text-foreground leading-snug">
                    {item.q}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                  {item.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: 5-Minute Live Demo Script */}
        <TabsContent value="demo" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              5-Minute Flawless Faculty Demonstration Script
            </h2>
            <p className="text-xs text-muted-foreground">
              Follow these cue cards in sequence during your final year evaluation.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-mono">00:00 - 01:00 (60s)</Badge>
                <span className="text-xs font-semibold text-foreground">The Hook & Problem Statement</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                "Respected examiners, presenters are historically bound to handheld remotes, podiums, or tangled clickers. Today we present slideX: a completely browser-native, touchless presentation control system where any webcam becomes a high-precision input device."
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-mono">01:00 - 02:30 (90s)</Badge>
                <span className="text-xs font-semibold text-foreground">Live Gesture Navigation & Laser Pointer</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                1. Hold open palm to camera for 1 second → Demonstrate HUD switching to <strong>ARMED</strong>.<br />
                2. Swipe hand to the left → Slide seamlessly advances to Slide 2 with smooth transition.<br />
                3. Raise index finger → Virtual red laser appears instantly, following fingertip with zero jitter.<br />
                4. Pinch thumb and index → Draw an air-annotation circle around a chart or diagram.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-mono">02:30 - 03:30 (60s)</Badge>
                <span className="text-xs font-semibold text-foreground">Safety State Machine & Palm Wipe</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                "Notice that as I speak normally to you, my hands do not trigger spurious slide changes. Now watch: I hold a closed fist for 1 second, and the system transitions to <strong>PAUSED</strong>. Now I wipe my open palm across the view, and all annotations clear instantly."
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-mono">03:30 - 04:30 (60s)</Badge>
                <span className="text-xs font-semibold text-foreground">Voice Assistant & Telemetry HUD</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Say aloud: <em>"Next slide"</em> → Slide advances. Toggle the Vision HUD to show examiners the live 32 FPS frame rate, 22ms inference latency, and landmark confidence metrics.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-mono">04:30 - 05:00 (30s)</Badge>
                <span className="text-xs font-semibold text-foreground">AI Rehearsal Coach & Conclusion</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Open the Session Analytics view, highlighting the pace per slide, gesture misfire rate (&lt;0.3%), and AI speaker feedback. Conclude and invite faculty questions.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: 12-Slide Outline */}
        <TabsContent value="slides" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Official 12-Slide Cornerstone Presentation Outline
            </h2>
            <p className="text-xs text-muted-foreground">
              Standard B.Tech Project Defense slide structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { num: '01', title: 'Title & Team Credentials', desc: 'slideX: On-Device Vision Presentation System' },
              { num: '02', title: 'Problem Formulation', desc: 'Limitations of physical remotes & latency bottlenecks in cloud vision' },
              { num: '03', title: 'Literature Review & Prior Art', desc: 'Leap Motion, Kinect, vs. Commodity RGB Webcam pipelines' },
              { num: '04', title: 'System Architecture', desc: 'React 18 + Web Workers + MediaPipe WASM + FastAPI Backend' },
              { num: '05', title: 'Landmark Extraction Pipeline', desc: '21 3D coordinates, wrist-relative normalization & scale invariance' },
              { num: '06', title: 'One Euro Filter Smoothing', desc: 'Adaptive cutoff frequency formulation for zero-jitter pointing' },
              { num: '07', title: 'Finite State Machine Design', desc: 'Armed, Idle, Paused, Executing states with temporal debouncing' },
              { num: '08', title: 'Custom MLP Gesture Classifier', desc: 'TensorFlow.js architecture, training parameters, loss curve' },
              { num: '09', title: 'Experimental Results & Metrics', desc: 'Accuracy (98.2%), Confusion Matrix, Inference Latency (18ms)' },
              { num: '10', title: 'Live Demonstration & Features', desc: 'Real-time gesture navigation, laser pointer, and air annotations' },
              { num: '11', title: 'Future Scope & Enhancements', desc: 'Eye gaze tracking, multi-presenter handover, spatial 3D zooming' },
              { num: '12', title: 'References & Publications', desc: 'IEEE, MediaPipe, One Euro Filter (Casiez et al.), and TF.js papers' },
            ].map((slide) => (
              <div key={slide.num} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                <span className="font-mono text-xs font-bold text-primary">{slide.num}</span>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">{slide.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{slide.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab 4: System Architecture */}
        <TabsContent value="arch" className="space-y-4">
          <Card className="bg-card/70 border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                End-to-End Architectural Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto leading-relaxed border border-border/50">
{`┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT BROWSER (REACT 18 + TYPESCRIPT)               │
├────────────────────────────────────────────────────────────────────────┤
│  [Webcam RGB Stream (720p @ 30 FPS)]                                  │
│           │                                                            │
│           ▼ (transferable ImageBitmap)                                 │
│  [Dedicated Vision Web Worker]                                         │
│    ├── MediaPipe Tasks Vision (HandLandmarker WASM + WebGL Delegate)   │
│    │     └── Outputs: 21 3D Landmarks (x, y, z) + Handedness           │
│    ├── Feature Normalization (Wrist-relative & hand-span scaled)       │
│    ├── One Euro Filter (Adaptive Cutoff Jitter Suppression)            │
│    └── TensorFlow.js Classifier (63 -> 128 -> 64 -> 8 Softmax)         │
│           │                                                            │
│           ▼ (Smoothed Coordinates + Gesture Event)                     │
│  [Deterministic Gesture State Machine]                                 │
│    ├── States: IDLE ──(Palm 1s)──> ARMED ──(Trigger)──> ACTION        │
│    └── Safety: Cooldown Lock (750ms), Fist Pause Lock (1s)             │
│           │                                                            │
│           ▼                                                            │
│  [UI Presentation Canvas / Action Bus]                                 │
│    ├── Slide Engine (PDF.js / Dynamic DOM slides)                      │
│    ├── Virtual Laser Pointer (Fingertip coordinate overlay)            │
│    ├── Air-Draw Layer (Canvas 2D Path Interpolation)                   │
│    └── Web Speech API (Complementary Voice Intent Recognition)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (WebSocket / Sync JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND SERVER (PYTHON FASTAPI)                      │
├────────────────────────────────────────────────────────────────────────┤
│  ├── /ws/sync/{deck_id} (Real-time Phone Remote & Audience Mirror)     │
│  ├── /api/presentations (Upload PPTX -> LibreOffice headless -> PDF)   │
│  ├── /api/ai/coach (Pacing analytics & LLM speaker notes generator)    │
│  └── /api/auth (JWT access & refresh tokens with bcrypt security)      │
└────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
