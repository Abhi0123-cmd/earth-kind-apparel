import { useState } from "react";
import { moderateContent } from "@/lib/content-moderation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Check, AlertTriangle, Loader2 } from "lucide-react";

interface StoryInputProps {
  productId: string;
  onStorySubmit: (story: string) => void;
}

export default function StoryInput({ productId, onStorySubmit }: StoryInputProps) {
  const { user } = useAuth();
  const [story, setStory] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!user) {
      setError("Please sign in to submit your story.");
      return;
    }

    const result = moderateContent(story);
    if (!result.ok) {
      setError(result.reason || "Content not allowed.");
      return;
    }

    setLoading(true);
    const { error: dbError } = await supabase
      .from("customer_stories" as any)
      .insert({ user_id: user.id, product_id: productId, story } as any);

    setLoading(false);

    if (dbError) {
      setError("Failed to save your story. Please try again.");
      return;
    }

    setSubmitted(true);
    onStorySubmit(story);
  };

  if (submitted) {
    return (
      <div className="border border-border p-6 text-center">
        <Check className="w-6 h-6 mx-auto mb-2 text-green-600" />
        <p className="font-body text-sm text-muted-foreground">
          Your story has been submitted! Check the back view to see how it looks on the tee.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6">
      <h3 className="font-display text-xl mb-2">YOUR SECOND CHANCE STORY</h3>
      <p className="text-sm text-muted-foreground font-body mb-4">
        Everyone gets a second chance in life. Share yours and see it on the back of your tee.
      </p>
      <textarea
        value={story}
        onChange={(e) => { setStory(e.target.value); setError(""); }}
        placeholder="Type or paste your real-life second chance story here..."
        rows={6}
        maxLength={2000}
        className="w-full border border-input bg-background px-3 py-2 text-sm font-body rounded-md placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground font-body">{story.length}/2000</span>
        <button
          onClick={handleSubmit}
          disabled={loading || story.trim().length === 0}
          className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-body uppercase tracking-widest font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Story"}
        </button>
      </div>
      {error && (
        <div className="flex items-start gap-2 mt-3 text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs font-body">{error}</p>
        </div>
      )}
    </div>
  );
}
