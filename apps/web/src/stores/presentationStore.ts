import { create } from 'zustand';

export interface SlideElement {
  id: string;
  type: 'heading' | 'text' | 'bullet_list' | 'code' | 'callout' | 'metric_grid';
  content: string | string[] | any;
  subContent?: string;
}

export interface SlideAnnotation {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  timestamp: number;
}

export interface Slide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  elements: SlideElement[];
  speakerNotes: string;
  annotations: SlideAnnotation[];
  estimatedDurationSeconds: number;
}

export interface Presentation {
  id: string;
  title: string;
  description: string;
  category: string;
  updatedAt: string;
  createdAt: string;
  author: string;
  slides: Slide[];
  theme: 'dark' | 'light' | 'midnight' | 'academic';
}

interface PresentationStore {
  presentations: Presentation[];
  currentPresentationId: string;
  currentSlideIndex: number;
  laserPointer: { x: number; y: number; active: boolean };
  zoomLevel: number;
  activeColor: string;
  strokeWidth: number;
  
  // Actions
  setCurrentPresentation: (id: string) => void;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  setLaserPointer: (pointer: { x: number; y: number; active: boolean }) => void;
  setZoomLevel: (zoom: number) => void;
  addAnnotation: (slideIndex: number, annotation: SlideAnnotation) => void;
  clearAnnotations: (slideIndex: number) => void;
  updateSpeakerNotes: (slideIndex: number, notes: string) => void;
  createPresentation: (title: string, description: string) => string;
  addFullPresentation: (deck: Presentation) => void;
}

const INITIAL_PRESENTATIONS: Presentation[] = [
  {
    id: 'deck-1',
    title: 'slideX: On-Device Vision for Touchless Presentation Systems',
    description: 'Final Year Cornerstone Engineering Defense on MediaPipe HandLandmarker, TFJS gesture classification, and zero-latency human-computer interaction.',
    category: 'Computer Science & AI',
    author: 'Project Viva Candidate',
    updatedAt: '2026-10-24T09:30:00Z',
    createdAt: '2026-10-20T10:00:00Z',
    theme: 'dark',
    slides: [
      {
        id: 's1-1',
        slideNumber: 1,
        title: 'slideX',
        subtitle: 'Production-Grade AI-Powered Gesture-Controlled Presentation System',
        estimatedDurationSeconds: 45,
        speakerNotes: 'Good morning committee members and advisors. Today I am presenting slideX: a completely browser-native, touchless presentation control system powered by local computer vision.',
        annotations: [],
        elements: [
          {
            id: 'e1-1',
            type: 'heading',
            content: 'Touchless Human-Computer Interaction',
          },
          {
            id: 'e1-2',
            type: 'callout',
            content: 'Client-Side MediaPipe WASM • TensorFlow.js Landmark MLP • 30+ FPS Zero-Data-Leak Architecture',
          },
          {
            id: 'e1-3',
            type: 'bullet_list',
            content: [
              'Webcam-driven slide navigation, virtual laser pointing, and spatial air-drawing',
              'Deterministic gesture state machine with One Euro filter landmark smoothing',
              'Integrated speech intent recognition & AI rehearsal pacing analytics',
            ],
          },
        ],
      },
      {
        id: 's1-2',
        slideNumber: 2,
        title: 'The Problem Space',
        subtitle: 'Limitations of Physical Presenter Remotes and Hardware Clickers',
        estimatedDurationSeconds: 60,
        speakerNotes: 'Traditional presentations suffer from physical remotes running out of battery, tethering the speaker to a podium, or causing awkward pauses when switching between laser pointers and drawing pens.',
        annotations: [],
        elements: [
          {
            id: 'e2-1',
            type: 'metric_grid',
            content: [
              { label: 'Hardware Failure Rate', value: '18.4%', desc: 'Dead batteries & lost USB RF dongles' },
              { label: 'Latency Target', value: '<50ms', desc: 'Imperceptible gesture-to-action threshold' },
              { label: 'Privacy Standard', value: '100%', desc: 'Zero camera frames ever transmitted to cloud' },
            ],
          },
          {
            id: 'e2-2',
            type: 'text',
            content: 'slideX removes all specialized hardware dependencies: any standard 720p webcam becomes a precision input instrument.',
          },
        ],
      },
      {
        id: 's1-3',
        slideNumber: 3,
        title: 'System Architecture',
        subtitle: 'Multi-Tier Monorepo with Isolated Vision Engine and Offscreen Canvas',
        estimatedDurationSeconds: 90,
        speakerNotes: 'Here we see the technical separation: the vision pipeline runs outside the React render loop to preserve 60 FPS UI responsiveness. Offscreen landmark extraction feeds our One Euro filter and state machine.',
        annotations: [],
        elements: [
          {
            id: 'e3-1',
            type: 'code',
            content: `[Webcam Stream (720p @ 30fps)]
        │
        ▼
[MediaPipe Vision Worker (WASM + GPU)]
        │  (21 3D Coordinates)
        ▼
[One Euro Filter Smoothing Layer]
        │  (Jitter Reduction & Frequency Tuning)
        ▼
[Custom TF.js Landmark MLP (Softmax)]
        │  (Confidence > 0.85)
        ▼
[Deterministic State Machine] ──> [Presenter Action Bus]
(IDLE ──> ARMED ──> ACTION)       (Next, Prev, Laser, AirDraw)`,
          },
        ],
      },
      {
        id: 's1-4',
        slideNumber: 4,
        title: 'Gesture State Machine & Smoothing',
        subtitle: 'Preventing False Positives through Hysteresis and Cooldown Locks',
        estimatedDurationSeconds: 75,
        speakerNotes: 'A major pitfall in academic vision systems is accidental triggers. slideX solves this using an explicit Armed/Idle state machine requiring a 1-second open palm hold, paired with adaptive temporal debounce.',
        annotations: [],
        elements: [
          {
            id: 'e4-1',
            type: 'bullet_list',
            content: [
              'One Euro Filter: Minimizes jitter at low speeds while maintaining snappy response during fast sweeps',
              'Armed Activation: Open palm held for 1000ms arms the trigger bus',
              'Fist Lock: Closed fist for 1000ms immediately pauses tracking during audience conversations',
              'Directional Swipe Hysteresis: Requires 60px positional displacement and velocity vector alignment',
            ],
          },
        ],
      },
      {
        id: 's1-5',
        slideNumber: 5,
        title: 'Experimental Results & Conclusion',
        subtitle: 'Benchmarking Inference Latency Across Varied Lighting Conditions',
        estimatedDurationSeconds: 60,
        speakerNotes: 'Our model achieves 98.2% test accuracy on landmark vectors and maintains 32+ FPS on standard integrated GPUs without dropped frames. Let us now move to the live demonstration.',
        annotations: [],
        elements: [
          {
            id: 'e5-1',
            type: 'metric_grid',
            content: [
              { label: 'Classification Accuracy', value: '98.2%', desc: 'Across 8 core gesture categories' },
              { label: 'Avg Inference Time', value: '18.4ms', desc: 'On browser WebGL delegate' },
              { label: 'Misfire Rate', value: '<0.3%', desc: 'Under normal ambient lighting' },
            ],
          },
          {
            id: 'e5-2',
            type: 'callout',
            content: 'Ready for interactive viva evaluation and live camera execution.',
          },
        ],
      },
    ],
  },
  {
    id: 'deck-2',
    title: 'Autonomous Mobile Robotics & Visual SLAM',
    description: 'Technical breakdown of graph-based SLAM, loop closure detection, and real-time obstacle avoidance.',
    category: 'Robotics',
    author: 'Robotics Lab',
    updatedAt: '2026-10-23T14:15:00Z',
    createdAt: '2026-10-18T11:00:00Z',
    theme: 'academic',
    slides: [
      {
        id: 's2-1',
        slideNumber: 1,
        title: 'Visual SLAM for Autonomous Systems',
        subtitle: 'Simultaneous Localization and Mapping using Monocular & RGB-D Sensors',
        estimatedDurationSeconds: 60,
        speakerNotes: 'Welcome. This presentation examines sparse keypoint extraction and bundle adjustment in GPS-denied environments.',
        annotations: [],
        elements: [
          {
            id: 'e21-1',
            type: 'heading',
            content: 'Visual SLAM Pipeline Overview',
          },
          {
            id: 'e21-2',
            type: 'bullet_list',
            content: [
              'Feature Extraction: ORB (Oriented FAST and Rotated BRIEF) detector',
              'Pose Graph Optimization: g2o non-linear least squares solver',
              'Loop Closure Verification: DBoW2 bag-of-words visual vocabulary',
            ],
          },
        ],
      },
      {
        id: 's2-2',
        slideNumber: 2,
        title: 'Trajectory Drift & Correction',
        subtitle: 'Comparative Evaluation Across Euroc MAV Dataset',
        estimatedDurationSeconds: 60,
        speakerNotes: 'Notice the absolute trajectory error reduction after applying loop closure constraints.',
        annotations: [],
        elements: [
          {
            id: 'e22-1',
            type: 'metric_grid',
            content: [
              { label: 'RMSE Translation', value: '0.042m', desc: 'Euclidean drift per 100m' },
              { label: 'Rotational Error', value: '0.81°', desc: 'Yaw drift before loop closure' },
              { label: 'Keyframe Rate', value: '15 Hz', desc: 'Processing constraint on ARM SoC' },
            ],
          },
        ],
      },
    ],
  },
];

export const usePresentationStore = create<PresentationStore>((set, get) => ({
  presentations: INITIAL_PRESENTATIONS,
  currentPresentationId: 'deck-1',
  currentSlideIndex: 0,
  laserPointer: { x: 0.5, y: 0.5, active: false },
  zoomLevel: 1.0,
  activeColor: '#ef4444',
  strokeWidth: 4,

  setCurrentPresentation: (id) =>
    set({
      currentPresentationId: id,
      currentSlideIndex: 0,
      zoomLevel: 1.0,
      laserPointer: { x: 0.5, y: 0.5, active: false },
    }),

  setCurrentSlideIndex: (index) => {
    const current = get().presentations.find((p) => p.id === get().currentPresentationId);
    if (!current) return;
    const clamped = Math.max(0, Math.min(index, current.slides.length - 1));
    set({ currentSlideIndex: clamped, zoomLevel: 1.0 });
  },

  nextSlide: () => {
    const { presentations, currentPresentationId, currentSlideIndex } = get();
    const current = presentations.find((p) => p.id === currentPresentationId);
    if (!current) return;
    if (currentSlideIndex < current.slides.length - 1) {
      set({ currentSlideIndex: currentSlideIndex + 1, zoomLevel: 1.0 });
    }
  },

  prevSlide: () => {
    const { currentSlideIndex } = get();
    if (currentSlideIndex > 0) {
      set({ currentSlideIndex: currentSlideIndex - 1, zoomLevel: 1.0 });
    }
  },

  goToSlide: (index) => {
    get().setCurrentSlideIndex(index);
  },

  setLaserPointer: (pointer) => set({ laserPointer: pointer }),

  setZoomLevel: (zoom) => {
    const clamped = Math.max(1.0, Math.min(zoom, 3.0));
    set({ zoomLevel: clamped });
  },

  addAnnotation: (slideIndex, annotation) => {
    set((state) => {
      const presentations = state.presentations.map((p) => {
        if (p.id !== state.currentPresentationId) return p;
        const slides = p.slides.map((s, idx) => {
          if (idx !== slideIndex) return s;
          return {
            ...s,
            annotations: [...s.annotations, annotation],
          };
        });
        return { ...p, slides };
      });
      return { presentations };
    });
  },

  clearAnnotations: (slideIndex) => {
    set((state) => {
      const presentations = state.presentations.map((p) => {
        if (p.id !== state.currentPresentationId) return p;
        const slides = p.slides.map((s, idx) => {
          if (idx !== slideIndex) return s;
          return { ...s, annotations: [] };
        });
        return { ...p, slides };
      });
      return { presentations };
    });
  },

  updateSpeakerNotes: (slideIndex, notes) => {
    set((state) => {
      const presentations = state.presentations.map((p) => {
        if (p.id !== state.currentPresentationId) return p;
        const slides = p.slides.map((s, idx) => {
          if (idx !== slideIndex) return s;
          return { ...s, speakerNotes: notes };
        });
        return { ...p, slides };
      });
      return { presentations };
    });
  },

  createPresentation: (title, description) => {
    const id = `deck-${Date.now()}`;
    const newDeck: Presentation = {
      id,
      title,
      description,
      category: 'General',
      author: 'Presenter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: 'dark',
      slides: [
        {
          id: `${id}-s1`,
          slideNumber: 1,
          title: title,
          subtitle: 'Created in slideX',
          estimatedDurationSeconds: 60,
          speakerNotes: 'Slide 1 introduction.',
          annotations: [],
          elements: [
            {
              id: 'e1',
              type: 'heading',
              content: title,
            },
            {
              id: 'e2',
              type: 'text',
              content: description || 'Add your presentation content here.',
            },
          ],
        },
      ],
    };

    set((state) => ({
      presentations: [newDeck, ...state.presentations],
      currentPresentationId: id,
      currentSlideIndex: 0,
    }));

    return id;
  },

  addFullPresentation: (deck) => {
    set((state) => ({
      presentations: [deck, ...state.presentations.filter((p) => p.id !== deck.id)],
      currentPresentationId: deck.id,
      currentSlideIndex: 0,
    }));
  },
}));
