// Creative-angle library. An angle is measured by exact-phrase matches in caption OR transcript.
// Premise / hook / structure are OUR editorial suggestions for the brief — they are never presented as data.

export interface Angle {
  id: string;
  name: string;
  phrases: string[];
  description: string;
  premise: string;
  hook: string; // {topic} is replaced with the market topic
  structure: string[];
}

export const ANGLES: Angle[] = [
  {
    id: "heat",
    name: "Heat & summer",
    phrases: ["heat", "hot weather", "humidity"],
    description: "Content framed around heat, hot weather or humidity.",
    premise: "Put {topic} through real heat and show what holds up.",
    hook: "Everyone talks about {topic} in perfect conditions. What happens at 42°C?",
    structure: ["Temperature proof on screen", "Close-up of the product/gear", "Start the activity outdoors", "The struggle: sweat, sun, environment", "Honest result and verdict"],
  },
  {
    id: "tested",
    name: "I tried / tested",
    phrases: ["i tried", "tested"],
    description: "First-person trials and tests.",
    premise: "A first-person test with a clear question and an honest verdict.",
    hook: "I tested {topic} so you don't have to.",
    structure: ["State the question in one line", "Show the setup", "Run the test", "The surprising moment", "Verdict with a number"],
  },
  {
    id: "budget",
    name: "Budget",
    phrases: ["budget", "cheap", "affordable"],
    description: "Budget and affordability framing.",
    premise: "Show the affordable path to a result people assume is expensive.",
    hook: "You don't need to spend a lot on {topic}. Here's proof.",
    structure: ["The expensive assumption", "The budget alternative", "Side-by-side use", "Cost breakdown on screen", "Verdict"],
  },
  {
    id: "luxury",
    name: "Luxury",
    phrases: ["luxury", "expensive"],
    description: "Premium / luxury framing.",
    premise: "Open the door to the premium end and show whether it's worth it.",
    hook: "Is the most expensive {topic} actually worth it?",
    structure: ["Price reveal", "Unboxing / arrival", "Details up close", "Real use", "Worth it or not"],
  },
  {
    id: "ranking",
    name: "Ranking / tier list",
    phrases: ["tier list", "ranking", "ranked"],
    description: "Tier lists and rankings.",
    premise: "Rank the options with a clear, opinionated framework.",
    hook: "I ranked every {topic} option so you don't have to.",
    structure: ["State the criteria", "Bottom tier fast", "Middle tier with reasons", "Top pick reveal", "Ask viewers to disagree"],
  },
  {
    id: "storytime",
    name: "Storytime",
    phrases: ["storytime", "story time"],
    description: "Narrative storytelling.",
    premise: "Tell one real story where {topic} changed the outcome.",
    hook: "Storytime: the day {topic} went completely wrong.",
    structure: ["Cold open on the peak moment", "Rewind to the setup", "Rising tension", "Turning point", "Lesson learned"],
  },
  {
    id: "myth",
    name: "Myth busting",
    phrases: ["myth", "myths"],
    description: "Debunking common beliefs.",
    premise: "Take one widely-believed claim and test it on camera.",
    hook: "The biggest myth about {topic} — busted.",
    structure: ["State the myth", "Why people believe it", "The test", "The evidence", "What to do instead"],
  },
  {
    id: "mistakes",
    name: "Mistakes",
    phrases: ["mistakes", "stop doing"],
    description: "Common mistakes / what to avoid.",
    premise: "Name the mistakes most people make and fix one on camera.",
    hook: "Stop making these {topic} mistakes.",
    structure: ["Mistake #1 shown", "Why it matters", "Mistake #2", "The fix demonstrated", "Save-this CTA"],
  },
  {
    id: "tips",
    name: "Tips & hacks",
    phrases: ["tips", "hack"],
    description: "Tips and hacks.",
    premise: "One genuinely useful trick, demonstrated fast.",
    hook: "The {topic} hack nobody told you about.",
    structure: ["Problem in one shot", "The hack", "Demonstration", "Result", "Save-this CTA"],
  },
  {
    id: "tutorial",
    name: "Tutorial",
    phrases: ["how to", "tutorial", "step by step"],
    description: "How-to and step-by-step tutorials.",
    premise: "A clean step-by-step that gets the viewer to a result.",
    hook: "How to get {topic} right in under a minute.",
    structure: ["End result first", "Step 1", "Step 2", "Step 3", "Final result + recap"],
  },
  {
    id: "review",
    name: "Honest review",
    phrases: ["honest review", "review"],
    description: "Reviews and honest opinions.",
    premise: "An honest review with one clear verdict.",
    hook: "My honest review of {topic} after real use.",
    structure: ["Verdict teaser", "What it is", "What's good", "What's not", "Who it's for"],
  },
  {
    id: "comparison",
    name: "Comparison",
    phrases: ["versus", "comparison", "compared"],
    description: "Head-to-head comparisons.",
    premise: "Two options, same conditions, one winner.",
    hook: "{topic}: which one actually wins?",
    structure: ["Introduce both", "Same test for both", "Key difference", "Surprise detail", "Winner"],
  },
  {
    id: "unboxing",
    name: "Unboxing",
    phrases: ["unboxing", "unbox"],
    description: "Unboxing and first impressions.",
    premise: "First impressions from the moment it arrives.",
    hook: "Unboxing the {topic} everyone's talking about.",
    structure: ["Package on screen", "Open", "First look details", "First use", "First impression"],
  },
  {
    id: "grwm",
    name: "GRWM",
    phrases: ["grwm", "get ready with me"],
    description: "Get-ready-with-me format.",
    premise: "Get ready with me, with {topic} as the thread.",
    hook: "Get ready with me — {topic} edition.",
    structure: ["Talk-to-camera opener", "Step-by-step prep", "Story while prepping", "Final look", "Out the door"],
  },
  {
    id: "pov",
    name: "POV",
    phrases: ["pov"],
    description: "POV-framed videos.",
    premise: "Put the viewer inside the {topic} moment.",
    hook: "POV: you finally tried {topic}.",
    structure: ["POV text overlay", "First-person shot", "The moment", "Reaction", "Payoff"],
  },
  {
    id: "day-in-life",
    name: "Day in the life",
    phrases: ["day in the life", "day in my life"],
    description: "Day-in-the-life vlogs.",
    premise: "A real day where {topic} fits into life.",
    hook: "A day in my life, built around {topic}.",
    structure: ["Morning", "The {topic} moment", "Midday", "Evening", "Reflection"],
  },
  {
    id: "before-after",
    name: "Before & after",
    phrases: ["before and after", "transformation"],
    description: "Transformations and before/after.",
    premise: "A visible before/after that the viewer can trust.",
    hook: "Before vs after {topic}. Watch the difference.",
    structure: ["Before", "The process", "Midpoint", "After", "Side-by-side"],
  },
  {
    id: "challenge",
    name: "Challenge",
    phrases: ["challenge"],
    description: "Challenges.",
    premise: "A challenge with a clear rule and stakes.",
    hook: "Can {topic} survive this challenge?",
    structure: ["The rule", "The stakes", "Attempt", "Tension", "Result"],
  },
  {
    id: "beginner",
    name: "Beginner",
    phrases: ["beginner", "for beginners", "first time"],
    description: "Beginner-focused content.",
    premise: "Meet beginners where they are.",
    hook: "If you're new to {topic}, start here.",
    structure: ["Reassure the beginner", "The one thing to know", "Demo", "Common fear addressed", "Next step"],
  },
  {
    id: "motivation",
    name: "Motivation",
    phrases: ["motivation", "discipline"],
    description: "Motivational framing.",
    premise: "A motivational arc grounded in a real moment.",
    hook: "This is your sign to start {topic}.",
    structure: ["The low point", "The decision", "The work", "Proof", "Call to act"],
  },
  {
    id: "routine",
    name: "Routine",
    phrases: ["routine", "morning routine"],
    description: "Routines.",
    premise: "A repeatable routine the viewer can steal.",
    hook: "My {topic} routine that actually works.",
    structure: ["Why this routine", "Step 1", "Step 2", "Step 3", "Result"],
  },
  {
    id: "bts",
    name: "Behind the scenes",
    phrases: ["behind the scenes", "bts"],
    description: "Behind-the-scenes content.",
    premise: "Show the part of {topic} nobody normally sees.",
    hook: "What you don't see behind {topic}.",
    structure: ["The polished result", "Cut to the mess", "Process", "People", "Back to the result"],
  },
];

// Visual styles measured by Oriane's in-video AI (visual similarity to a text asset). Prompts are cached assets.
export interface VisualStyle {
  id: string;
  name: string;
  prompt: string;
  description: string;
  templateId: string;
}

export const VISUAL_STYLES: VisualStyle[] = [
  { id: "outdoor-sun", name: "Desert heat", prompt: "a person outdoors under hot desert sun", description: "The frames show people outdoors under hot desert sun.", templateId: "heat" },
  { id: "pov", name: "First-person POV", prompt: "first-person point of view footage", description: "Shot from the creator's own point of view.", templateId: "pov" },
  { id: "talking-head", name: "Talking head", prompt: "a person talking directly to the camera", description: "A creator speaking straight to camera.", templateId: "review" },
  { id: "studio-product", name: "Studio product shot", prompt: "close-up product shot on a plain studio background", description: "Product close-ups on a clean studio background.", templateId: "unboxing" },
  { id: "group", name: "Group / community", prompt: "a group of people together outdoors", description: "Groups of people together outdoors.", templateId: "day-in-life" },
  { id: "night-city", name: "Night / city lights", prompt: "outdoors at night under city lights", description: "Outdoors at night under city lights.", templateId: "routine" },
];
