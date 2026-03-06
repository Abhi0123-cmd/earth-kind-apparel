const BLOCKED_WORDS = [
  // Profanity
  "fuck", "shit", "ass", "bitch", "damn", "crap", "dick", "bastard", "slut", "whore",
  "nigger", "nigga", "fag", "faggot", "retard", "cunt", "piss", "cock", "pussy",
  "motherfucker", "bullshit", "asshole", "dumbass", "jackass", "goddamn",
  // Political
  "modi", "trump", "biden", "congress", "bjp", "aap", "democrat", "republican",
  "communist", "fascist", "nazi", "liberal", "conservative", "marxist", "capitalist",
  "election", "vote for", "political party", "politician",
  // Religious
  "allah", "jesus christ", "hindu", "muslim", "christian", "sikh", "buddhist",
  "quran", "bible", "gita", "church", "mosque", "temple", "pray", "religion",
  "god is", "atheist", "convert", "pagan", "jihad", "crusade",
  // Sensitive
  "suicide", "kill", "murder", "rape", "terrorist", "bomb", "gun", "shoot",
  "drug", "cocaine", "heroin", "meth", "weed", "alcohol", "drunk",
  "hate", "racist", "sexist", "homophobic", "transphobic",
];

export function moderateContent(text: string): { ok: boolean; reason?: string } {
  const lower = text.toLowerCase();

  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(lower)) {
      return {
        ok: false,
        reason: "Your story contains content that isn't allowed. Please keep it free of profanity, political, religious, or sensitive topics.",
      };
    }
  }

  if (text.length < 20) {
    return { ok: false, reason: "Your story should be at least 20 characters long." };
  }

  if (text.length > 2000) {
    return { ok: false, reason: "Your story should be under 2000 characters." };
  }

  return { ok: true };
}
