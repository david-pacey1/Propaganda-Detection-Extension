import { evaluationSet, type EvalCategory, type Outcome } from '@/data/evaluation';
import type { Analysis } from '@/lib/analysis';

export interface CategoryBreakdown {
	category: EvalCategory;
	total: number;
	detected: number;
	missed: number;
	recall: number;
}

export interface OutcomeTally {
	outcome: Outcome;
	label: string;
	count: number;
}

/**
 * A post counts as "flagged" only when its analysis alleges manipulation — i.e.
 * at least one finding carries a manipulation verdict (Propaganda, Technique
 * identified, Misleading, Contradicted, Logical fallacy, etc.). Neutral
 * fact-checks ("Verified", "Needs independent verification") do NOT count as
 * flagging manipulation: they confirm or defer a claim without alleging
 * manipulation, so a clean post that only receives them is treated as cleared.
 *
 * This mirrors the spirit of the extension's own `isMisinformation` check
 * (which keys off the same verdict substrings) but is applied here to decide
 * the outcome label, not the badge colour.
 */
const MANIPULATION_VERDICT_PATTERNS = [
	'contradict',
	'mislead',
	'disput',
	'propaganda',
	'manipulat',
	'false',
	'fabricat',
	'deepfake',
	'technique identified',
	'logical fallacy',
];

export function isFlaggedAsManipulation(analysis: Analysis | null): boolean {
	if (!analysis?.findings) return false;
	return analysis.findings.some(finding => {
		const verdict = String(finding.verdict || '').toLowerCase();
		return MANIPULATION_VERDICT_PATTERNS.some(pattern => verdict.includes(pattern));
	});
}

/**
 * Descriptive breakdown of what the extension actually found, grouped by the
 * manipulation family each real post represents. "Detected" means the
 * extension's genuine analysis alleged manipulation for that post.
 *
 * For manipulation families this is recall (sensitivity): of the genuinely
 * manipulative posts in that family, how many were flagged. For the
 * "Legitimate content" family the same number is the false-positive rate: of
 * the clean posts, how many were incorrectly flagged. This is a descriptive
 * tally of the recorded runs, not a computed performance benchmark.
 */
export function computeCategoryBreakdown(items: typeof evaluationSet): CategoryBreakdown[] {
	const categories: EvalCategory[] = [];
	for (const item of items) {
		if (!categories.includes(item.category)) categories.push(item.category);
	}
	return categories.map(category => {
		const subset = items.filter(item => item.category === category);
		const total = subset.length;
		const detected = subset.filter(
			item => item.verified && isFlaggedAsManipulation(item.analysis),
		).length;
		const missed = total - detected;
		const recall = total === 0 ? 0 : detected / total;
		return { category, total, detected, missed, recall };
	});
}

export const pct = (value: number) => `${Math.round(value * 1000) / 10}%`;

export const evaluationBreakdown = computeCategoryBreakdown(evaluationSet);

const OUTCOME_LABELS: Record<Outcome, string> = {
	'true-positive': 'Successfully identified positive',
	'true-negative': 'Successfully identified negative',
	'false-positive': 'False positive',
	'false-negative': 'False negative',
};

export const outcomeLabel = (outcome: Outcome): string => OUTCOME_LABELS[outcome];

export const outcomeTallies: OutcomeTally[] = (
	['true-positive', 'true-negative', 'false-positive', 'false-negative'] as Outcome[]
).map(outcome => ({
	outcome,
	label: OUTCOME_LABELS[outcome],
	count: evaluationSet.filter(item => item.outcome === outcome).length,
}));

/**
 * Plain-language performance statistics computed from the 17-post evidence
 * library. These describe this small, curated set only — they are not a
 * production benchmark. Denominators are explained in the UI in plain language
 * rather than as equations.
 */
export interface EvalStats {
	total: number;
	truePositives: number;
	trueNegatives: number;
	falsePositives: number;
	falseNegatives: number;
	/** Of the posts the extension flagged as manipulation, the share that truly were. */
	precision: number;
	/** Of the genuinely manipulative posts, the share the extension flagged. */
	recall: number;
	/** Of the clean (non-manipulative) posts, the share the extension wrongly flagged. */
	falsePositiveRate: number;
	/** Of all 17 posts, the share labelled correctly (true positives + true negatives). */
	accuracy: number;
}

function computeStats(items: typeof evaluationSet): EvalStats {
	const truePositives = items.filter(i => i.outcome === 'true-positive').length;
	const trueNegatives = items.filter(i => i.outcome === 'true-negative').length;
	const falsePositives = items.filter(i => i.outcome === 'false-positive').length;
	const falseNegatives = items.filter(i => i.outcome === 'false-negative').length;
	const total = items.length;
	const flagged = truePositives + falsePositives;
	const manipulative = truePositives + falseNegatives;
	const clean = trueNegatives + falsePositives;
	return {
		total,
		truePositives,
		trueNegatives,
		falsePositives,
		falseNegatives,
		precision: flagged === 0 ? 0 : truePositives / flagged,
		recall: manipulative === 0 ? 0 : truePositives / manipulative,
		falsePositiveRate: clean === 0 ? 0 : falsePositives / clean,
		accuracy: total === 0 ? 0 : (truePositives + trueNegatives) / total,
	};
}

export const evaluationStats = computeStats(evaluationSet);
