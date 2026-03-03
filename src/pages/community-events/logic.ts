/**
 * Community Events — Logic
 * Form state, validation, file upload, and Supabase submission.
 * Two tracks: Engineering (PR link) and MBA (PDF upload).
 * Zero UI code — everything consumed by ui.tsx.
 */
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../resources/config/config";

/* ── Types ── */
export type Track = "engineering" | "mba" | null;

export interface FormData {
  fullName: string;
  university: string;
  rollNumber: string;
  universityEmail: string;
  personalEmail: string;
  photoFile: File | null;
  teamParticipants: string;
  events: string[];
  prLink: string;
  prdFile: File | null;
  demoLink: string;
}

export interface FormErrors {
  fullName?: string;
  university?: string;
  rollNumber?: string;
  universityEmail?: string;
  personalEmail?: string;
  photoFile?: string;
  teamParticipants?: string;
  events?: string;
  prLink?: string;
  prdFile?: string;
  demoLink?: string;
}

/* ── Constants ── */
export const EVENTS = [
  {
    id: "hackathon",
    icon: "emoji_events",
    title: "Hackathon",
    subtitle: "Build with Hushh APIs",
    description: "48-hour sprint to build something extraordinary with our APIs. Real prizes, real impact.",
    accent: "bg-blue-500",
  },
  {
    id: "bug_bash",
    icon: "bug_report",
    title: "Bug Bash",
    subtitle: "Find bugs, earn Hushh Coins",
    description: "Hunt down bugs across our platform. Every valid report earns you Hushh Coins.",
    accent: "bg-red-500",
  },
  {
    id: "demo_day",
    icon: "mic",
    title: "Demo Day",
    subtitle: "Present to our team",
    description: "Show off your project to our engineering and product team. Get real feedback.",
    accent: "bg-emerald-500",
  },
  {
    id: "office_hours",
    icon: "schedule",
    title: "Office Hours",
    subtitle: "Weekly open Q&A",
    description: "Drop in every Thursday for a live Q&A with our engineers. No agenda needed.",
    accent: "bg-amber-500",
  },
] as const;

export const TRACK_OPTIONS = [
  {
    id: "engineering" as Track,
    icon: "terminal",
    title: "Engineering",
    subtitle: "Built a project?",
    description: "Submit your code & demo video.",
  },
  {
    id: "mba" as Track,
    icon: "analytics",
    title: "MBA",
    subtitle: "Created a PRD?",
    description: "Submit your document & demo video.",
  },
] as const;

/* ── Initial form state ── */
const INITIAL_FORM: FormData = {
  fullName: "",
  university: "",
  rollNumber: "",
  universityEmail: "",
  personalEmail: "",
  photoFile: null,
  teamParticipants: "",
  events: [],
  prLink: "",
  prdFile: null,
  demoLink: "",
};

/* ── Validators ── */
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isEduEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.(edu|ac\.[a-z]{2,}|edu\.[a-z]{2,})$/i.test(email);

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isYouTubeUrl = (url: string) => {
  if (!isValidUrl(url)) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("youtube")
  );
};

/* ── Progress calculator ── */
const calculateProgress = (track: Track, form: FormData): number => {
  if (!track) return 0;

  const totalFields = track === "engineering" ? 10 : 10;
  let filled = 0;

  if (form.fullName.trim()) filled++;
  if (form.university.trim()) filled++;
  if (form.rollNumber.trim()) filled++;
  if (form.universityEmail.trim()) filled++;
  if (form.personalEmail.trim()) filled++;
  if (form.photoFile) filled++;
  if (form.teamParticipants.trim()) filled++;
  if (form.events.length > 0) filled++;
  if (form.demoLink.trim()) filled++;

  if (track === "engineering" && form.prLink.trim()) filled++;
  if (track === "mba" && form.prdFile) filled++;

  return Math.round((filled / totalFields) * 100);
};

/* ── Hook ── */
export const useCommunityEventsLogic = () => {
  const navigate = useNavigate();
  const [track, setTrack] = useState<Track>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [prdFileName, setPrdFileName] = useState<string | null>(null);

  /* ── Progress ── */
  const progress = useMemo(() => calculateProgress(track, form), [track, form]);

  /* ── Field updater ── */
  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Clear error on change
      if (errors[key]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [errors]
  );

  /* ── Event toggle ── */
  const toggleEvent = useCallback((eventId: string) => {
    setForm((prev) => {
      const has = prev.events.includes(eventId);
      return {
        ...prev,
        events: has
          ? prev.events.filter((e) => e !== eventId)
          : [...prev.events, eventId],
      };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.events;
      return next;
    });
  }, []);

  /* ── Photo handler ── */
  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate image type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          photoFile: "Please select an image file.",
        }));
        return;
      }

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photoFile: "Image must be under 5 MB.",
        }));
        return;
      }

      updateField("photoFile", file);
      setPhotoPreview(URL.createObjectURL(file));
    },
    [updateField]
  );

  /* ── PDF handler ── */
  const handlePrdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        setErrors((prev) => ({
          ...prev,
          prdFile: "Please upload a PDF file.",
        }));
        return;
      }

      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          prdFile: "PDF must be under 10 MB.",
        }));
        return;
      }

      updateField("prdFile", file);
      setPrdFileName(file.name);
    },
    [updateField]
  );

  /* ── Validate ── */
  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (!form.fullName.trim()) errs.fullName = "Name is required.";
    if (!form.university.trim()) errs.university = "University is required.";
    if (!form.rollNumber.trim()) errs.rollNumber = "Roll number is required.";

    if (!form.universityEmail.trim()) {
      errs.universityEmail = "University email is required.";
    } else if (!isEduEmail(form.universityEmail)) {
      errs.universityEmail = "Please use a valid .edu email address.";
    }

    if (!form.personalEmail.trim()) {
      errs.personalEmail = "Personal email is required.";
    } else if (!isValidEmail(form.personalEmail)) {
      errs.personalEmail = "Please enter a valid email.";
    }

    if (!form.photoFile) errs.photoFile = "Profile photo is required.";
    if (!form.teamParticipants.trim())
      errs.teamParticipants = "Team participants are required.";
    if (form.events.length === 0)
      errs.events = "Select at least one event.";

    if (!form.demoLink.trim()) {
      errs.demoLink = "Demo video link is required.";
    } else if (!isYouTubeUrl(form.demoLink)) {
      errs.demoLink = "Please provide a valid YouTube link.";
    }

    // Track-specific
    if (track === "engineering") {
      if (!form.prLink.trim()) {
        errs.prLink = "GitHub PR link is required.";
      } else if (!isValidUrl(form.prLink)) {
        errs.prLink = "Please enter a valid URL.";
      }
    }

    if (track === "mba") {
      if (!form.prdFile) errs.prdFile = "PRD document is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, track]);

  /* ── File upload helper ── */
  const uploadFile = async (
    file: File,
    bucket: string,
    path: string
  ): Promise<string | null> => {
    const supabase = config.supabaseClient;
    if (!supabase) return null;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return urlData?.publicUrl ?? null;
  };

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    if (!track) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const supabase = config.supabaseClient;
      if (!supabase) throw new Error("Supabase not initialized");

      // Get current user (optional — registration can be public)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const timestamp = Date.now();
      const sanitizedName = form.fullName.replace(/[^a-zA-Z0-9]/g, "_");

      // Upload photo
      let photoUrl: string | null = null;
      if (form.photoFile) {
        const ext = form.photoFile.name.split(".").pop();
        const photoPath = `community/${sanitizedName}_${timestamp}_photo.${ext}`;
        photoUrl = await uploadFile(form.photoFile, "community-uploads", photoPath);
      }

      // Upload PRD (MBA track)
      let prdUrl: string | null = null;
      if (track === "mba" && form.prdFile) {
        const prdPath = `community/${sanitizedName}_${timestamp}_prd.pdf`;
        prdUrl = await uploadFile(form.prdFile, "community-uploads", prdPath);
      }

      // Insert registration
      const { error: insertError } = await supabase
        .from("community_registrations")
        .insert({
          user_id: user?.id ?? null,
          track,
          full_name: form.fullName.trim(),
          university: form.university.trim(),
          roll_number: form.rollNumber.trim(),
          university_email: form.universityEmail.trim().toLowerCase(),
          personal_email: form.personalEmail.trim().toLowerCase(),
          photo_url: photoUrl,
          team_participants: form.teamParticipants.trim(),
          events: form.events,
          pr_link: track === "engineering" ? form.prLink.trim() : null,
          prd_document_url: track === "mba" ? prdUrl : null,
          demo_link: form.demoLink.trim(),
        });

      if (insertError) throw insertError;

      setIsSubmitted(true);
    } catch (err) {
      console.error("Registration error:", err);
      setErrors((prev) => ({
        ...prev,
        fullName: "Something went wrong. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [track, form, validate]);

  /* ── Navigation ── */
  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    // Track
    track,
    setTrack,
    // Form
    form,
    errors,
    updateField,
    toggleEvent,
    handlePhotoChange,
    handlePrdChange,
    photoPreview,
    prdFileName,
    // Progress
    progress,
    // Submission
    isSubmitting,
    isSubmitted,
    handleSubmit,
    // Navigation
    handleBack,
  };
};
