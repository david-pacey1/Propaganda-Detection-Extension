import JSZip from 'jszip';

/**
 * Builds a branded PowerPoint (.pptx) slide deck for Proper Gander.
 *
 * A .pptx is an OOXML package: a ZIP of XML parts. We assemble the parts by
 * hand (no native office library is installed) using JSZip, drawing each slide
 * as full-content shapes so the deck does not depend on a specific master's
 * placeholders. The result opens in PowerPoint, Keynote and Google Slides.
 *
 * All content is real and sourced from the project itself — no invented
 * capabilities, results or technical details.
 */

// Slide dimensions (16:9): 13.333" x 7.5" in English Metric Units (914400/in).
const SLIDE_W = 12192000;
const SLIDE_H = 6858000;
const MARGIN = 685800; // 0.75"
const CONTENT_W = SLIDE_W - MARGIN * 2;

// Brand palette (mirrors index.css).
const AUBERGINE = '4C3959';
const INK = '332D38';
const PAGE = 'FAFAF7';
const COPPER = '986740';
const COPPER_LIGHT = 'F8EEE3';
const SAGE = '537866';
const SAGE_LIGHT = 'EDF4EE';
const LILAC = 'EEEBF3';
const WHITE = 'FFFFFF';
const MUTED = '877390';
const BODY_TEXT = '5B5360';
const SUBTLE = '9C8AA6';

type RunOpts = {
	bold?: boolean;
	color?: string;
	size?: number; // hundredths of a point
	spc?: number; // letter spacing in 1/100 pt
	italic?: boolean;
};

function esc(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function run(text: string, opts: RunOpts = {}): string {
	const rPr = [
		'lang="en-US"',
		opts.size ? `sz="${opts.size}"` : '',
		opts.bold ? 'b="1"' : '',
		opts.italic ? 'i="1"' : '',
		opts.spc !== undefined ? `spc="${opts.spc}"` : '',
	].filter(Boolean).join(' ');
	const color = opts.color ?? BODY_TEXT;
	return `<a:r><a:rPr ${rPr}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:rPr><a:t>${esc(text)}</a:t></a:r>`;
}

type ParaOpts = {
	level?: 0 | 1;
	bullet?: boolean;
	align?: 'l' | 'c' | 'r';
	spaceBefore?: number;
	spaceAfter?: number;
};

function para(text: string, runOpts: RunOpts = {}, pOpts: ParaOpts = {}): string {
	const level = pOpts.level ?? 0;
	const bullet = pOpts.bullet ?? true;
	const marL = level === 0 ? 342900 : 743075;
	const indent = -342900;
	const bu = bullet
		? `<a:buFont typeface="Arial"/><a:buChar char="•"/>`
		: `<a:buNone/>`;
	const align = pOpts.align ?? 'l';
	const spcB = pOpts.spaceBefore ?? 0;
	const spcA = pOpts.spaceAfter ?? 160;
	return `<a:p><a:pPr marL="${marL}" indent="${indent}" algn="${align}" ${bullet ? '' : ''}><a:spcBef><a:spcPts val="${spcB}"/></a:spcBef><a:spcAft><a:spcPts val="${spcA}"/></a:spcAft>${bu}</a:pPr>${run(text, runOpts)}</a:p>`;
}

/** A multi-run paragraph (for mixed styling in one line). */
function paraRuns(runs: string[], pOpts: ParaOpts = {}): string {
	const level = pOpts.level ?? 0;
	const bullet = pOpts.bullet ?? true;
	const marL = level === 0 ? 342900 : 743075;
	const indent = -342900;
	const bu = bullet ? `<a:buFont typeface="Arial"/><a:buChar char="•"/>` : `<a:buNone/>`;
	const align = pOpts.align ?? 'l';
	const spcB = pOpts.spaceBefore ?? 0;
	const spcA = pOpts.spaceAfter ?? 160;
	return `<a:p><a:pPr marL="${marL}" indent="${indent}" algn="${align}"><a:spcBef><a:spcPts val="${spcB}"/></a:spcBef><a:spcAft><a:spcPts val="${spcA}"/></a:spcAft>${bu}</a:pPr>${runs.join('')}</a:p>`;
}

let shapeId = 100;
function nextId(): number {
	return shapeId++;
}

function textBox(
	x: number,
	y: number,
	cx: number,
	cy: number,
	paras: string[],
	anchor: 't' | 'm' | 'b' = 't',
): string {
	const id = nextId();
	return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="text ${id}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="${anchor}"/><a:lstStyle/>${paras.join('')}</p:txBody></p:sp>`;
}

function rect(x: number, y: number, cx: number, cy: number, fill: string, line?: string): string {
	const id = nextId();
	const ln = line ? `<a:ln w="9525"><a:solidFill><a:srgbClr val="${line}"/></a:solidFill></a:ln>` : `<a:ln><a:noFill/></a:ln>`;
	return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="rect ${id}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>${ln}</p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`;
}

/** A filled box with a big stat number and a small label, for the metrics row. */
function statBox(x: number, y: number, cx: number, cy: number, value: string, label: string, accent: string): string {
	const fill = WHITE;
	const id = nextId();
	const valuePara = `<a:p><a:pPr algn="c"><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="40"/></a:spcAft><a:buNone/></a:pPr>${run(value, { bold: true, color: accent, size: 3200 })}</a:p>`;
	const labelPara = `<a:p><a:pPr algn="c"><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="0"/></a:spcAft><a:buNone/></a:pPr>${run(label, { color: SUBTLE, size: 1100 })}</a:p>`;
	return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="stat ${id}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 4000"/></a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="E4D9EB"/></a:solidFill></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="ctr"/><a:lstStyle/>${valuePara}${labelPara}</p:txBody></p:sp>`;
}

function slide(bg: string, shapes: string[]): string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm></p:grpSpPr>${shapes.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

// ---- Slide builders -------------------------------------------------------

function titleSlide(): string {
	const shapes = [
		rect(0, 0, 91440, SLIDE_H, COPPER), // left accent spine
		textBox(MARGIN, 2100000, CONTENT_W, 500000, [
			para('A MEDIA-LITERACY WORKSPACE', { color: LILAC, size: 1300, spc: 300, bold: true }, { bullet: false, spaceAfter: 0 }),
		], 't'),
		textBox(MARGIN, 2550000, CONTENT_W, 1300000, [
			para('Proper Gander', { color: WHITE, size: 7200, bold: true, spc: -40 }, { bullet: false, spaceAfter: 0 }),
		], 't'),
		textBox(MARGIN, 3750000, CONTENT_W, 700000, [
			para('Give a post a second look.', { color: LILAC, size: 3000, spc: -10 }, { bullet: false, spaceAfter: 0 }),
		], 't'),
		textBox(MARGIN, 5650000, CONTENT_W, 500000, [
			para('Context, not conclusions.', { color: COPPER_LIGHT, size: 1500, italic: true }, { bullet: false, spaceAfter: 0 }),
		], 't'),
	];
	return slide(AUBERGINE, shapes);
}

function contentSlide(title: string, paras: string[], extra: string[] = []): string {
	const shapes = [
		textBox(MARGIN, 430000, CONTENT_W, 700000, [
			para(title, { color: AUBERGINE, size: 3600, bold: true, spc: -20 }, { bullet: false, spaceAfter: 0 }),
		], 't'),
		rect(MARGIN, 1180000, 731520, 50800, COPPER), // accent bar under title
		textBox(MARGIN, 1420000, CONTENT_W, 4900000, paras, 't'),
		...extra,
	];
	return slide(PAGE, shapes);
}

function closingSlide(origin: string): string {
	const shapes = [
		rect(0, 0, 91440, SLIDE_H, COPPER),
		textBox(MARGIN, 2300000, CONTENT_W, 900000, [
			para('Context, not conclusions.', { color: WHITE, size: 5400, bold: true, spc: -30 }, { bullet: false, spaceAfter: 0 }),
		], 't'),
		textBox(MARGIN, 3450000, CONTENT_W, 600000, [
			para('A lens for your feed — not a filter.', { color: LILAC, size: 2400 }, { bullet: false, spaceAfter: 0 }),
		], 't'),
		textBox(MARGIN, 5650000, CONTENT_W, 500000, [
			paraRuns([
				run('Proper Gander', { color: COPPER_LIGHT, size: 1400, bold: true }),
				run('   ·   ', { color: MUTED, size: 1400 }),
				run(origin, { color: MUTED, size: 1400 }),
			], { bullet: false, spaceAfter: 0 }),
		], 't'),
	];
	return slide(AUBERGINE, shapes);
}

// ---- Slide content --------------------------------------------------------

function buildSlides(origin: string): string[] {
	const slides: string[] = [];

	// 1. Title
	slides.push(titleSlide());

	// 2. The problem
	slides.push(contentSlide('The problem', [
		para('Misinformation spreads faster than corrections — and faster than anyone can manually fact-check.', { color: BODY_TEXT, size: 1800 }),
		para('Social feeds show the post, not the context: who benefits, what has been debunked, and which manipulation technique is in play.', { color: BODY_TEXT, size: 1800 }),
		para('Existing tools either block content or hand down verdicts, leaving people no room to judge for themselves.', { color: BODY_TEXT, size: 1800 }),
		para('Detection demos usually show only the happy path — no false positives, no measured performance.', { color: BODY_TEXT, size: 1800 }),
	]));

	// 3. What it does
	slides.push(contentSlide('What Proper Gander does', [
		para('Paste a social post or text excerpt — or import a public Bluesky post directly.', { color: BODY_TEXT, size: 1800 }),
		para('An AI analyst adds a concise context layer beside the original: claims worth checking, manipulation techniques, and suggested references.', { color: BODY_TEXT, size: 1800 }),
		para('The original content stays fully visible and untouched. Nothing is hidden or removed.', { color: BODY_TEXT, size: 1800 }),
		para('Save analyses to a personal workspace and explore a learning library of techniques and fallacies.', { color: BODY_TEXT, size: 1800 }),
	]));

	// 4. How it works
	slides.push(contentSlide('How the analysis works', [
		para('A calibrated AI analyst classifies each post across a broad taxonomy:', { color: BODY_TEXT, size: 1800, bold: true }),
		para('fabricated & manipulated media, deceptive framing, emotional exploitation, logical fallacies, smears, propaganda devices, and coordinated behaviour.', { color: MUTED, size: 1600 }, { level: 1 }),
		para('Findings are typed — rhetorical signals, manipulation techniques, and checkable factual claims.', { color: BODY_TEXT, size: 1800 }),
		para('Factual claims get a calibrated verdict — Verified, Contradicted, Disputed, Misleading, or Needs independent verification — with sourced references.', { color: BODY_TEXT, size: 1800 }),
		para('The system distinguishes persuasion from falsehood: rhetoric alone is flagged as a technique, not branded a lie.', { color: BODY_TEXT, size: 1800 }),
	]));

	// 5. Browser extension
	slides.push(contentSlide('In your feed, not a separate app', [
		para('A Manifest V3 browser extension adds discreet, dismissible badges alongside posts on X, Bluesky, Facebook, Instagram, LinkedIn and Reddit.', { color: BODY_TEXT, size: 1800 }),
		para('The AI analyses each post as you scroll — including comments — and verifies claims against the web.', { color: BODY_TEXT, size: 1800 }),
		para('When misinformation is detected, a one-tap link surfaces a retrieved source that disproves or contextualises the claim.', { color: BODY_TEXT, size: 1800 }),
		para('Overlays render in an isolated Shadow DOM; the host site and your feed stay untouched. No posting permissions, ever.', { color: BODY_TEXT, size: 1800 }),
	]));

	// 6. Transparency & measurement — with stat boxes
	const statY = 4350000;
	const statH = 1500000;
	const gap = 200000;
	const statW = (CONTENT_W - gap * 3) / 4;
	const statShapes = [
		statBox(MARGIN + (statW + gap) * 0, statY, statW, statH, '91.7%', 'Precision', SAGE),
		statBox(MARGIN + (statW + gap) * 1, statY, statW, statH, '91.7%', 'Recall', AUBERGINE),
		statBox(MARGIN + (statW + gap) * 2, statY, statW, statH, '20%', 'False-positive rate', COPPER),
		statBox(MARGIN + (statW + gap) * 3, statY, statW, statH, '88.2%', 'Accuracy', SAGE),
	];
	slides.push(contentSlide('Transparent and measurable', [
		para('A public methodology page documents how detection is evaluated — not just a demo that works on the happy path.', { color: BODY_TEXT, size: 1800 }),
		para('A 17-post evidence library: real, publicly documented posts cited to fact-checkers, each run through the extension pipeline with the unedited output recorded.', { color: BODY_TEXT, size: 1800 }),
		para('Each post is labelled by outcome: true positive, true negative, false positive, false negative.', { color: BODY_TEXT, size: 1800 }),
		para('Reported performance on this small, curated set — not a production benchmark. Figures are computed directly from the labelled library; re-running may shift a verdict, since analysis is non-deterministic.', { color: MUTED, size: 1500, italic: true }),
	], statShapes));

	// 7. Technology
	slides.push(contentSlide('Built on', [
		paraRuns([run('Web app — ', { color: AUBERGINE, size: 1700, bold: true }), run('React Router 8 (SSR), TypeScript, React 19, Tailwind CSS, shadcn/ui, Vite.', { color: BODY_TEXT, size: 1700 })], { spaceAfter: 200 }),
		paraRuns([run('Server — ', { color: AUBERGINE, size: 1700, bold: true }), run('Node.js + Express, same-origin /api/* resource routes, server-side loaders and actions.', { color: BODY_TEXT, size: 1700 })], { spaceAfter: 200 }),
		paraRuns([run('Data & auth — ', { color: AUBERGINE, size: 1700, bold: true }), run('PocketBase + SQLite, with JSVM migrations and server-side hooks; built-in email verification.', { color: BODY_TEXT, size: 1700 })], { spaceAfter: 200 }),
		paraRuns([run('AI — ', { color: AUBERGINE, size: 1700, bold: true }), run('an integrated model-powered analyst with streaming responses and web-search / browsing tools for claim verification.', { color: BODY_TEXT, size: 1700 })], { spaceAfter: 200 }),
		paraRuns([run('Browser extension — ', { color: AUBERGINE, size: 1700, bold: true }), run('Manifest V3 (vanilla JS), Shadow DOM overlays, a service worker for cross-origin fact-check requests.', { color: BODY_TEXT, size: 1700 })], { spaceAfter: 200 }),
		paraRuns([run('Also — ', { color: AUBERGINE, size: 1700, bold: true }), run('installable PWA, JSZip packaging, Zod validation, framer-motion, lucide-react, recharts.', { color: BODY_TEXT, size: 1700 })], { spaceAfter: 200 }),
	]));

	// 8. Closing
	slides.push(closingSlide(origin));

	return slides;
}

// ---- OOXML package parts --------------------------------------------------

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

const THEME = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Proper Gander"><a:themeElements><a:clrScheme name="Proper Gander"><a:dk1><a:srgbClr val="332D38"/></a:dk1><a:lt1><a:srgbClr val="FAFAF7"/></a:lt1><a:dk2><a:srgbClr val="4C3959"/></a:dk2><a:lt2><a:srgbClr val="EEEBF3"/></a:lt2><a:accent1><a:srgbClr val="4C3959"/></a:accent1><a:accent2><a:srgbClr val="986740"/></a:accent2><a:accent3><a:srgbClr val="537866"/></a:accent3><a:accent4><a:srgbClr val="9E7DB0"/></a:accent4><a:accent5><a:srgbClr val="8A6FA6"/></a:accent5><a:accent6><a:srgbClr val="B07A3F"/></a:accent6><a:hlink><a:srgbClr val="8A6BA0"/></a:hlink><a:folHlink><a:srgbClr val="8A6BA0"/></a:folHlink></a:clrScheme><a:fontScheme name="Proper Gander"><a:majorFont><a:latin typeface="Manrope"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Manrope"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Proper Gander"><a:fillStyleLst><a:solidFill><a:srgbClr val="4C3959"/></a:solidFill><a:solidFill><a:srgbClr val="986740"/></a:solidFill><a:solidFill><a:srgbClr val="537866"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="4C3959"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="986740"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="537866"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:srgbClr val="FAFAF7"/></a:solidFill><a:solidFill><a:srgbClr val="EEEBF3"/></a:solidFill><a:solidFill><a:srgbClr val="4C3959"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;

const SLIDE_MASTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`;

const SLIDE_MASTER_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`;

const SLIDE_LAYOUT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld></p:sldLayout>`;

const SLIDE_LAYOUT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;

function coreProps(origin: string): string {
	const now = new Date().toISOString();
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Proper Gander — Project Overview</dc:title><dc:creator>Proper Gander</dc:creator><cp:lastModifiedBy>Proper Gander</cp:lastModifiedBy><dc:subject>A media-literacy workspace for analyzing social posts</dc:subject><dc:description>Project overview: what it does, the problem it solves, and the technology it uses.</dc:description><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified><cp:keywords>media literacy, misinformation, fact-checking, AI</cp:keywords><cp:category>Project overview</cp:category></cp:coreProperties>`;
}

const APP_PROPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Proper Gander</Application><Company>Proper Gander</Company></Properties>`;

function presentationXml(slideCount: number): string {
	const sldIdLst = Array.from({ length: slideCount }, (_, i) => {
		const id = 256 + i;
		const rid = `rId${i + 2}`;
		return `<p:sldId id="${id}" r:id="${rid}"/>`;
	}).join('');
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${sldIdLst}</p:sldIdLst><p:sldSz cx="${SLIDE_W}" cy="${SLIDE_H}" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle/></p:presentation>`;
}

function presentationRels(slideCount: number): string {
	const slideRels = Array.from({ length: slideCount }, (_, i) => {
		const rid = `rId${i + 2}`;
		return `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`;
	}).join('');
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slideRels}</Relationships>`;
}

function slideRels(): string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`;
}

/**
 * Assembles the full .pptx package and returns it as a Uint8Array.
 */
export async function buildPresentation(origin: string): Promise<Uint8Array> {
	const slides = buildSlides(origin);
	const zip = new JSZip();

	zip.file('[Content_Types].xml', CONTENT_TYPES);
	zip.file('_rels/.rels', ROOT_RELS);
	zip.file('ppt/theme/theme1.xml', THEME);
	zip.file('ppt/slideMasters/slideMaster1.xml', SLIDE_MASTER);
	zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', SLIDE_MASTER_RELS);
	zip.file('ppt/slideLayouts/slideLayout1.xml', SLIDE_LAYOUT);
	zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', SLIDE_LAYOUT_RELS);
	zip.file('ppt/presentation.xml', presentationXml(slides.length));
	zip.file('ppt/_rels/presentation.xml.rels', presentationRels(slides.length));
	zip.file('docProps/core.xml', coreProps(origin));
	zip.file('docProps/app.xml', APP_PROPS);

	slides.forEach((xml, i) => {
		zip.file(`ppt/slides/slide${i + 1}.xml`, xml);
		zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`, slideRels());
	});

	return zip.generateAsync({
		type: 'uint8array',
		compression: 'DEFLATE',
		compressionOptions: { level: 6 },
	});
}
