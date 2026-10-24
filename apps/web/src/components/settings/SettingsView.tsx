import * as React from 'react';
import { 
  SlidersHorizontal, 
  Hand, 
  Volume2, 
  Eye, 
  Keyboard, 
  Save, 
  RotateCcw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function SettingsView() {
  const { 
    dominantHand, 
    setDominantHand, 
    gestureSensitivity, 
    setGestureSensitivity,
    soundFeedback,
    setSoundFeedback,
    highContrast,
    setHighContrast
  } = useAppStore();

  const { addToast } = useToastStore();

  // Gesture Mapping state
  const [gestureMappings, setGestureMappings] = React.useState({
    openPalm: 'Arm Control',
    swipeLeft: 'Previous Slide',
    swipeRight: 'Next Slide',
    indexPoint: 'Laser Pointer',
    pinchDrag: 'Air-Draw Annotation',
    fistHold: 'Pause Control',
    thumbsUp: 'Confirm / Timer',
    twoFingers: 'Slide Grid',
    palmWipe: 'Clear Annotations',
  });

  const [oneEuroBeta, setOneEuroBeta] = React.useState(0.007);
  const [oneEuroMinCutoff, setOneEuroMinCutoff] = React.useState(1.0);
  const [cooldownMs, setCooldownMs] = React.useState(750);
  const [armedHoldMs, setArmedHoldMs] = React.useState(1000);

  const handleSave = () => {
    addToast({
      title: 'Settings Saved',
      description: 'Vision pipeline and gesture configurations updated successfully.',
      type: 'success',
    });
  };

  const handleReset = () => {
    setGestureSensitivity(0.75);
    setDominantHand('right');
    setSoundFeedback(true);
    setHighContrast(false);
    setOneEuroBeta(0.007);
    setOneEuroMinCutoff(1.0);
    setCooldownMs(750);
    setArmedHoldMs(1000);
    addToast({
      title: 'Defaults Restored',
      description: 'Factory defaults applied to gesture state machine.',
      type: 'default',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-in fade-in-0 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            System & Gesture Settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure MediaPipe vision parameters, One Euro smoothing, and custom gesture-to-action bindings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Restore Defaults
          </Button>
          <Button size="sm" onClick={handleSave} className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Vision Engine & Handedness */}
        <Card className="bg-card/70 border-border">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <Hand className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Vision Engine & Hand Tracking
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Configure landmark tracking handedness and sensitivity thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-6">
            {/* Dominant Hand Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Dominant Hand</p>
                <p className="text-[11px] text-muted-foreground">
                  The primary hand prioritized for laser pointing and gestures.
                </p>
              </div>
              <div className="flex items-center rounded-lg border border-border p-1 bg-muted/40">
                <button
                  onClick={() => setDominantHand('left')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    dominantHand === 'left' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Left Hand
                </button>
                <button
                  onClick={() => setDominantHand('right')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    dominantHand === 'right' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Right Hand
                </button>
              </div>
            </div>

            {/* Gesture Sensitivity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">Gesture Sensitivity</p>
                  <p className="text-[11px] text-muted-foreground">
                    Controls motion threshold multiplier for swipe and air-draw gestures.
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-primary">
                  {Math.round(gestureSensitivity * 100)}%
                </span>
              </div>
              <Slider
                value={[gestureSensitivity * 100]}
                onValueChange={(vals) => setGestureSensitivity(vals[0] / 100)}
                max={100}
                min={20}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: One Euro Filter & State Machine Parameters */}
        <Card className="bg-card/70 border-border">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                One Euro Filter & State Machine Parameters
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Fine-tune adaptive frequency filtering (fcmin, beta) and state transition locks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/70 p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-foreground">One Euro Beta (Speed Coefficient)</span>
                  <span className="font-mono text-primary font-semibold">{oneEuroBeta}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Controls cutoff frequency adaptation to hand velocity.
                </p>
                <Slider
                  value={[oneEuroBeta * 1000]}
                  onValueChange={(vals) => setOneEuroBeta(vals[0] / 1000)}
                  max={20}
                  min={1}
                  step={1}
                  className="pt-2"
                />
              </div>

              <div className="rounded-lg border border-border/70 p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-foreground">Minimum Cutoff (fcmin)</span>
                  <span className="font-mono text-primary font-semibold">{oneEuroMinCutoff} Hz</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Base cutoff frequency to eliminate jitter during static pointing.
                </p>
                <Slider
                  value={[oneEuroMinCutoff * 10]}
                  onValueChange={(vals) => setOneEuroMinCutoff(vals[0] / 10)}
                  max={30}
                  min={5}
                  step={1}
                  className="pt-2"
                />
              </div>

              <div className="rounded-lg border border-border/70 p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-foreground">Armed Hold Duration</span>
                  <span className="font-mono text-primary font-semibold">{armedHoldMs} ms</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Duration required to hold open palm before control activates.
                </p>
                <Slider
                  value={[armedHoldMs]}
                  onValueChange={(vals) => setArmedHoldMs(vals[0])}
                  max={2000}
                  min={500}
                  step={50}
                  className="pt-2"
                />
              </div>

              <div className="rounded-lg border border-border/70 p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-foreground">Gesture Refractory Cooldown</span>
                  <span className="font-mono text-primary font-semibold">{cooldownMs} ms</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Deadtime lockout after an action to prevent double slide skips.
                </p>
                <Slider
                  value={[cooldownMs]}
                  onValueChange={(vals) => setCooldownMs(vals[0])}
                  max={1500}
                  min={300}
                  step={50}
                  className="pt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Gesture-to-Action Mapping */}
        <Card className="bg-card/70 border-border">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Custom Gesture-to-Action Mapping
            </CardTitle>
            <CardDescription className="text-xs">
              Remap detected physical gestures to presentation action events.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="rounded-lg border border-border divide-y divide-border/60 text-xs">
              {[
                { label: 'Swipe Left', key: 'swipeLeft', current: gestureMappings.swipeLeft },
                { label: 'Swipe Right', key: 'swipeRight', current: gestureMappings.swipeRight },
                { label: 'Index Pointing', key: 'indexPoint', current: gestureMappings.indexPoint },
                { label: 'Pinch & Drag', key: 'pinchDrag', current: gestureMappings.pinchDrag },
                { label: 'Thumbs Up', key: 'thumbsUp', current: gestureMappings.thumbsUp },
                { label: 'Palm Wipe', key: 'palmWipe', current: gestureMappings.palmWipe },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <select
                    value={item.current}
                    onChange={(e) =>
                      setGestureMappings((prev) => ({ ...prev, [item.key]: e.target.value }))
                    }
                    className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Next Slide">Next Slide</option>
                    <option value="Previous Slide">Previous Slide</option>
                    <option value="Laser Pointer">Laser Pointer</option>
                    <option value="Air-Draw Annotation">Air-Draw Annotation</option>
                    <option value="Clear Annotations">Clear Annotations</option>
                    <option value="Slide Grid">Slide Grid</option>
                    <option value="Confirm / Timer">Confirm / Timer</option>
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Accessibility & Feedback */}
        <Card className="bg-card/70 border-border">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Accessibility & Keyboard Fallback
            </CardTitle>
            <CardDescription className="text-xs">
              Options for high-contrast presentation mode, audio cues, and hardware keys.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Audio Gesture Feedback</p>
                <p className="text-[11px] text-muted-foreground">
                  Play subtle audio click when a gesture triggers a slide change.
                </p>
              </div>
              <Switch checked={soundFeedback} onCheckedChange={setSoundFeedback} />
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <div>
                <p className="text-xs font-medium text-foreground">High Contrast Presentation Mode</p>
                <p className="text-[11px] text-muted-foreground">
                  Enhance laser visibility and slide element contrast for bright projector venues.
                </p>
              </div>
              <Switch checked={highContrast} onCheckedChange={setHighContrast} />
            </div>

            {/* Keyboard Shortcuts Reference */}
            <div className="border-t border-border/60 pt-4 space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Keyboard className="h-3.5 w-3.5" />
                Hardware Keyboard Fallbacks
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border">
                  <span>Next Slide</span>
                  <kbd className="font-mono bg-card px-1.5 py-0.5 rounded border text-[10px]">Space / →</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border">
                  <span>Prev Slide</span>
                  <kbd className="font-mono bg-card px-1.5 py-0.5 rounded border text-[10px]">←</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border">
                  <span>Toggle Laser</span>
                  <kbd className="font-mono bg-card px-1.5 py-0.5 rounded border text-[10px]">L</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border">
                  <span>Clear Draw</span>
                  <kbd className="font-mono bg-card px-1.5 py-0.5 rounded border text-[10px]">C</kbd>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
