// Family Dentistry film: one patient, one plan, one phone, then the clinic's window. Scene order, voiceover lines
// and minimum on-screen time. The screens are recordings of the prototype (scripts/record.mjs); the sounds are the
// app's own, played at the moments noted in public/clips/marks.json.
// Narrated by an American female voice: ElevenLabs "Sarah" (voiceover.mjs). npm run voiceover
// <break time="0.4s" /> is an ElevenLabs pause tag. Written for the ear: plain words, short sentences.

import type { SceneSpec } from '../components/Film';
import lengths from '../../public/clips/lengths.json';

export type SceneId = 'intro' | 'gate' | 'plan' | 'visit' | 'seal' | 'ask' | 'request' | 'care' | 'clinic' | 'never' | 'outro';

/** Length of each screen recording in seconds (written by scripts/record.mjs). */
export const CLIP_SECONDS = lengths as Partial<Record<SceneId, number>>;

const clip = (id: SceneId, extra = 0.6) => (CLIP_SECONDS[id] ?? 0) + extra;

export const SCENES: SceneSpec<SceneId>[] = [
  { id: 'intro', voiceover: 'This is Family Dentistry. <break time="0.3s" /> A treatment plan every patient can understand, and a little joy between visits.', minSeconds: 7 },
  { id: 'gate', voiceover: 'After the consultation, the plan arrives as a private link. No app to install. A year of birth opens it, and three quick questions set the tone.', minSeconds: clip('gate') },
  { id: 'plan', voiceover: 'Everything is in plain words, approved by the dentist. Four visits, about six weeks, and an honest estimate, never a surprise bill.', minSeconds: clip('plan') },
  { id: 'visit', voiceover: 'Tap a visit and it opens up. What happens, how it feels, and what to do before and after.', minSeconds: clip('visit') },
  { id: 'seal', voiceover: 'Press and hold to say you have read it. Then three quick taps check that you really understood.', minSeconds: clip('seal') },
  { id: 'ask', voiceover: 'Answers come only from the approved plan. Anything else goes to a real person, and you can watch it move. If something sounds urgent, it tells you to call the clinic, right now.', minSeconds: clip('ask') },
  { id: 'request', voiceover: 'Ready for the next step? Pick a day. It only shows as booked once reception confirms it.', minSeconds: clip('request') },
  { id: 'care', voiceover: 'After the visit, your aftercare wakes up. A list for today, a healing streak, and a quick check in on how it feels.', minSeconds: clip('care') },
  { id: 'clinic', voiceover: 'For the clinic, it is one calm window. Answer questions, confirm visits, draft a plan from approved content, and send it once the dentist signs off.', minSeconds: clip('clinic') },
  { id: 'never', voiceover: 'It never diagnoses. It never invents a price. And it never says booked too early.', minSeconds: 7 },
  { id: 'outro', voiceover: 'Family Dentistry. <break time="0.4s" /> Understood, and cared for, between every visit.', minSeconds: 5.5 },
];
