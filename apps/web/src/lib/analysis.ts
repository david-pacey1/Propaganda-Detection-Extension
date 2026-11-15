import { z } from 'zod';

export const findingSchema = z.object({
  kind: z.enum(['warning', 'technique', 'fact']),
  title: z.string().max(160),
  quote: z.string().default(''),
  explanation: z.string(),
  verdict: z.string().default('Needs verification'),
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
});
export const analysisSchema = z.object({
  summary: z.string(),
  findings: z.array(findingSchema).max(12),
  actorContext: z.string().default('A single post cannot establish an account’s intent or authenticity.'),
});
export type Finding = z.infer<typeof findingSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type SocialPost = {
  id: string;
  author: string;
  handle: string;
  initials: string;
  platform: string;
  text: string;
  image?: string;
  url?: string;
  time: string;
  demo?: boolean;
  analysis?: Analysis;
};
export function parseAnalysis(raw: string): Analysis | null {
  try {
    const text = raw.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const result = analysisSchema.safeParse(JSON.parse(text.slice(start, end + 1)));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
export function safeSource(url: string): boolean {
  try { return ['https:', 'http:'].includes(new URL(url).protocol); } catch { return false; }
}
export const signalLabels = { warning: 'Needs context', technique: 'Manipulation technique', fact: 'Fact check' };
