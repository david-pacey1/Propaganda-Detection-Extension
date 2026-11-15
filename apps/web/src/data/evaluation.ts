import type { Analysis } from '@/lib/analysis';

export type EvalCategory =
	| 'Logical fallacy'
	| 'Propaganda device'
	| 'Emotional manipulation'
	| 'Deceptive framing'
	| 'Manipulated media'
	| 'Coordinated behaviour'
	| 'Smears'
	| 'Legitimate content';

export type Outcome = 'true-positive' | 'true-negative' | 'false-positive' | 'false-negative';

export interface EvaluationItem {
	id: string;
	text: string;
	source: { title: string; url: string };
	context: string;
	postDate: string;
	platform: string;
	category: EvalCategory;
	analysis: Analysis | null;
	verified: boolean;
	notes: string;
	outcome: Outcome;
}

export const evaluationMeta = {
	label: 'Real-post evidence library',
	version: 'v1.1 — real posts, real extension runs, labelled outcomes',
	total: 17,
	capturedAt: '2026-11-15',
	summary:
		'Each entry is a real, publicly documented social post or public statement, cited to the fact-checker or news outlet that recorded it. The analysis shown was produced by running that exact post text through Proper Gander\'s browser-extension analysis pipeline (POST /api/extension/analyze) on the date above — not hand-written. Outputs are non-deterministic; re-running may differ slightly. Each post is labelled by outcome: successfully identified positive (true positive), successfully identified negative (true negative), false positive, or false negative. A post counts as flagged only when its analysis alleges manipulation (a verdict such as Propaganda, Technique identified, Misleading or Contradicted); neutral fact-checks (Verified, Needs independent verification) do not count as flagging manipulation.',
};

export const evaluationSet: EvaluationItem[] = [
	{
		"id": "ev-01",
		"outcome": "true-positive",
		"text": "What a bunch of malarkey! We know the value of voting Democratic when our votes count. It's important that you save your vote for the November election. We will need your help in electing Democrats up and down the ticket. Voting this Tuesday only enables the Republicans in their quest to elect Donald Trump again. Your vote makes a difference in November, not this Tuesday.",
		"source": {
			"title": "PolitiFact — Fake Joe Biden robocall in New Hampshire",
			"url": "https://politifact.com/factchecks/2024/jan/22/robocaller/fake-joe-biden-robocall-in-new-hampshire-tells-dem/"
		},
		"context": "An AI-cloned voice impersonating President Biden urged New Hampshire Democrats not to vote in the state primary. The FCC later fined the creator; the call was fabricated with ElevenLabs voice cloning. This is the call transcript.",
		"postDate": "2024-01-21",
		"platform": "Robocall (New Hampshire)",
		"category": "Manipulated media",
		"analysis": {
			"summary": "The post urges recipients in New Hampshire to vote Democratic and specifically claims that voting this Tuesday only enables Republicans and helps elect Donald Trump again, while asserting that voting this Tuesday does not matter for November. It contains no images. Verification was not performed because the post’s key claims are broad political persuasion rather than specific, checkable facts (e.g., no dates, offices, or election rules are cited).",
			"findings": [
				{
					"kind": "warning",
					"title": "Vague election-timing manipulation",
					"quote": "Your vote makes a difference in November, not this Tuesday.",
					"explanation": "The message attempts to steer behavior by implying that voting on a specific day is effectively pointless or harmful, without providing verifiable details about election rules or how votes are counted. This is a common framing tactic to redirect voter action.",
					"verdict": "Technique identified",
					"sources": []
				},
				{
					"kind": "warning",
					"title": "Us-vs-them fear/urgency framing",
					"quote": "Voting this Tuesday only enables the Republicans in their quest to elect Donald Trump again.",
					"explanation": "The post uses an adversarial narrative and urgency to pressure a specific voting choice, presenting a high-stakes outcome (“elect Donald Trump again”) tied to a single voting decision. This is persuasive rhetoric rather than a substantiated causal claim.",
					"verdict": "Technique identified",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "The post IS manipulated media (a synthetic voice clone), but the extension analyses text only — so it flags the rhetorical manipulation (us-versus-them framing, misleading urgency) without being able to confirm the audio is synthetic. That is an honest, visible limitation of single-post text analysis."
	},
	{
		"id": "ev-02",
		"outcome": "true-positive",
		"text": "Springfield Ohio residents are warning their pets and wildlife like ducks and geese are being eaten by Haitians.",
		"source": {
			"title": "Reuters Fact Check — No evidence of Haitian immigrants stealing and eating pets in Ohio",
			"url": "https://www.reuters.com/fact-check/no-evidence-haitian-immigrants-stealing-eating-pets-ohio-2024-09-10/"
		},
		"context": "A viral Facebook post (archived) helped launch the Springfield, Ohio pet-eating rumor. Springfield police and city officials confirmed no credible reports of pets being harmed by immigrants.",
		"postDate": "2024-09",
		"platform": "Facebook",
		"category": "Deceptive framing",
		"analysis": {
			"summary": "The post claims that Springfield, Ohio residents are warning that pets and local wildlife (ducks and geese) are being eaten by Haitians. It provides no evidence, sourcing, or context, and the claim functions as an accusatory us-vs-them narrative targeting a specific nationality/ethnic group.",
			"findings": [
				{
					"kind": "warning",
					"title": "Dehumanization & smears (scapegoating a protected group)",
					"quote": "being eaten by Haitians",
					"explanation": "The post attributes harm/cruelty to an entire group defined by nationality/ethnicity, framing them as predators. This is a classic scapegoating smear that can inflame hostility rather than inform.",
					"verdict": "Propaganda",
					"sources": []
				},
				{
					"kind": "technique",
					"title": "Vague, unverified attribution (“residents are warning”)",
					"quote": "Springfield Ohio residents are warning",
					"explanation": "The claim is presented as if it comes from credible local witnesses, but it provides no names, documentation, or verifiable details. This kind of vague attribution is often used to launder an unsubstantiated allegation as “what people are saying.”",
					"verdict": "Technique identified",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Real viral post text quoted directly by Reuters. The extension should flag the unsubstantiated rumor and fear appeal."
	},
	{
		"id": "ev-03",
		"outcome": "true-positive",
		"text": "Reports now show that people have had their pets abducted and eaten by people who shouldn't be in this country.",
		"source": {
			"title": "Reuters Fact Check — No evidence of Haitian immigrants stealing and eating pets in Ohio",
			"url": "https://www.reuters.com/fact-check/no-evidence-haitian-immigrants-stealing-eating-pets-ohio-2024-09-10/"
		},
		"context": "Then-VP-candidate JD Vance amplified the unsubstantiated rumor on X. He later acknowledged the claims were \"not substantiated.\"",
		"postDate": "2024-09-09",
		"platform": "X",
		"category": "Deceptive framing",
		"analysis": {
			"summary": "The post claims that reports show immigrants/people “who shouldn’t be in this country” have abducted and eaten people’s pets. It provides no names, locations, dates, or sources, and functions as fearmongering and us-vs-them framing rather than a verifiable, specific claim.",
			"findings": [
				{
					"kind": "warning",
					"title": "Fearmongering & dehumanizing us-vs-them framing",
					"quote": "people who shouldn't be in this country",
					"explanation": "The wording frames an out-group as inherently dangerous and implies criminality without evidence, aiming to provoke fear and anger. This is a classic emotional hijacking tactic rather than a checkable statement.",
					"verdict": "Propaganda",
					"sources": []
				},
				{
					"kind": "fact",
					"title": "Unverifiable allegation (no specifics provided)",
					"quote": "Reports now show that people have had their pets abducted and eaten",
					"explanation": "The claim is presented as if supported by “reports,” but the post gives no verifiable details (where, when, which reports, or any case identifiers). As written, it cannot be independently checked.",
					"verdict": "Needs independent verification",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Real X post quoted by Reuters. Amplification of an unverified claim by a high-profile account."
	},
	{
		"id": "ev-04",
		"outcome": "true-positive",
		"text": "They're eating the dogs. They're eating the cats. They're eating the pets of the people that live there.",
		"source": {
			"title": "PBS NewsHour — Trump amplifies false racist rumor about Ohio's Haitian immigrants in debate",
			"url": "https://www.pbs.org/newshour/politics/watch-trump-amplifies-false-racist-rumor-about-ohios-haitian-immigrants-in-debate"
		},
		"context": "Donald Trump repeated the false pet-eating claim on the presidential debate stage, amplifying it to a national audience.",
		"postDate": "2024-09-10",
		"platform": "Presidential debate",
		"category": "Smears",
		"analysis": {
			"summary": "The post claims that a group of people is “eating the dogs” and “eating the cats,” specifically framing it as violence against pets belonging to residents. This is a widely circulated allegation that functions as fearmongering, but the provided text contains no verifiable sourcing or context.",
			"findings": [
				{
					"kind": "warning",
					"title": "Fearmongering / outrage bait",
					"quote": "They're eating the dogs. They're eating the cats.",
					"explanation": "The graphic claim is designed to provoke disgust and fear quickly, without providing evidence or context. This kind of sensational framing is commonly used to manipulate audience emotions during high-stakes political moments.",
					"verdict": "Propaganda",
					"sources": []
				},
				{
					"kind": "technique",
					"title": "Unsubstantiated atrocity allegation",
					"quote": "They're eating the pets of the people that live there.",
					"explanation": "The statement presents a specific atrocity claim but provides no source, location, date, or attribution, making it effectively impossible to verify as written. In practice, such claims are often repeated without credible documentation.",
					"verdict": "Technique identified",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Verbatim debate quote documented by PBS. Amplification of a dehumanizing false rumor."
	},
	{
		"id": "ev-05",
		"outcome": "true-positive",
		"text": "We already have won.",
		"source": {
			"title": "Al Jazeera / PolitiFact — Fact Check: US Election 2024 guide to spotting falsehoods",
			"url": "https://www.aljazeera.com/news/2024/11/5/fact-check-us-election-2024-your-guide-to-spotting-falsehoods"
		},
		"context": "On election night 2020, then-President Trump prematurely declared victory: \"We already have won.\" He had not; ballots were still being counted. PolitiFact rated it \"Pants on Fire.\"",
		"postDate": "2020-11-04",
		"platform": "X / public statement",
		"category": "Propaganda device",
		"analysis": {
			"summary": "The post claims, without context or evidence, that the speaker’s side has already won. There are no images and no specific, checkable factual assertions beyond the vague victory claim.",
			"findings": [
				{
					"kind": "warning",
					"title": "Vague victory claim (engagement/assurance rhetoric)",
					"quote": "We already have won.",
					"explanation": "This is an unsubstantiated, absolute-sounding assertion presented as settled fact, but it provides no details that would allow verification. It functions more as motivational/assurance rhetoric than a checkable claim.",
					"verdict": "Technique identified",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Verbatim false victory claim. A textbook \"big lie\" / premature victory declaration."
	},
	{
		"id": "ev-06",
		"outcome": "true-positive",
		"text": "We caught them with 2,600 votes. … And every vote was written by the same person.",
		"source": {
			"title": "Al Jazeera / PolitiFact — Fact Check: US Election 2024 guide to spotting falsehoods",
			"url": "https://www.aljazeera.com/news/2024/11/5/fact-check-us-election-2024-your-guide-to-spotting-falsehoods"
		},
		"context": "At an Allentown, Pennsylvania rally, Trump falsely claimed 2,600 fraudulent ballots were found in Lancaster County. Officials said the investigation was into voter registration applications, not fraudulent ballots. Excerpt as documented by Al Jazeera/PolitiFact.",
		"postDate": "2024-10",
		"platform": "Rally / X",
		"category": "Deceptive framing",
		"analysis": {
			"summary": "The post claims that an election or vote count involved 2,600 votes and alleges that every one of those votes was written by the same person. No images are provided, and the claim is presented as evidence of wrongdoing without any verifiable details (e.g., election name, date, or audit trail).",
			"findings": [
				{
					"kind": "fact",
					"title": "Unverified election/vote manipulation claim",
					"quote": "We caught them with 2,600 votes. … And every vote was written by the same person.",
					"explanation": "This asserts a specific number of votes (2,600) and a specific attribution claim (all votes written by one person). Without identifying the election, jurisdiction, date, or providing documentation, the claim cannot be verified from the post alone.",
					"verdict": "Needs independent verification",
					"sources": []
				},
				{
					"kind": "warning",
					"title": "Loaded accusation without evidence",
					"quote": "We caught them",
					"explanation": "The phrasing frames the claim as a definitive exposure (“caught them”) while providing no substantiating evidence, which can function as engagement/credibility manipulation. This is a rhetorical signal rather than a checkable fact by itself.",
					"verdict": "Technique identified",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Documented excerpt (omission marked). False election-fraud claim."
	},
	{
		"id": "ev-07",
		"outcome": "true-positive",
		"text": "When the measles, mumps and rubella vaccines are given together in the combined MMR vaccine, there could be a possibility they're quite lethal.",
		"source": {
			"title": "PolitiFact — MMR / measles vaccine safety",
			"url": "https://politifact.com/factchecks/2026/aug/11/donald-trump/mmr-measles-vaccine-safety-cdc/"
		},
		"context": "Donald Trump stated the combined MMR vaccine could be \"quite lethal.\" PolitiFact rated the claim \"Pants on Fire\"; the CDC and decades of evidence show the MMR vaccine is safe.",
		"postDate": "2026-08-10",
		"platform": "Public remarks",
		"category": "Emotional manipulation",
		"analysis": {
			"summary": "The post claims that giving measles, mumps, and rubella vaccines together in the combined MMR vaccine could be “quite lethal.” This is a health-related factual claim about vaccine safety that requires verification; no images are provided.",
			"findings": [
				{
					"kind": "fact",
					"title": "MMR vaccine lethality claim",
					"quote": "there could be a possibility they're quite lethal",
					"explanation": "This claim is not supported by established medical evidence. Major health authorities state that MMR vaccines are safe and that serious adverse events are rare, with no credible evidence that the vaccine is “quite lethal.”",
					"verdict": "Contradicted",
					"sources": [
						{
							"title": "CDC - MMR Vaccine Safety",
							"url": "https://www.cdc.gov/vaccinesafety/vaccines/mmr.html"
						},
						{
							"title": "WHO - Measles vaccines and safety",
							"url": "https://www.who.int/news-room/fact-sheets/detail/measles"
						}
					]
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Documented claim as stated by PolitiFact. Health misinformation via fear appeal about vaccine safety."
	},
	{
		"id": "ev-08",
		"outcome": "true-positive",
		"text": "And then I see the disinfectant, where it knocks it out in a minute, one minute. And is there a way we can do something like that, by injection inside or almost a cleaning?",
		"source": {
			"title": "FactCheck.org — The White House spins Trump’s disinfectant remarks",
			"url": "https://www.factcheck.org/2020/04/the-white-house-spins-trumps-disinfectant-remarks/"
		},
		"context": "At an April 2020 White House briefing, President Trump mused aloud about whether disinfectant could be used “by injection inside” against COVID-19. Medical authorities warned the public not to ingest or inject disinfectant; poison-control calls rose. This is the verbatim remark as transcribed by FactCheck.org.",
		"postDate": "2020-04-23",
		"platform": "White House briefing",
		"category": "Emotional manipulation",
		"analysis": {
			"summary": "The post quotes a White House briefing remark about using disinfectant to “knock it out” quickly and asks whether something similar could be done via injection or internal cleaning. This is a checkable claim about the content of a specific briefing quote, but the provided text alone does not include enough context to verify the exact wording or attribution.",
			"findings": [
				{
					"kind": "fact",
					"title": "Attribution/quote verification needed for the exact wording",
					"quote": "And then I see the disinfectant, where it knocks it out in a minute, one minute.",
					"explanation": "This is presented as a verbatim quote from a White House briefing. The claim is checkable (exact transcript/recording), but the prompt provides no link or date, so verification requires searching for the original briefing transcript/audio.",
					"verdict": "Needs independent verification",
					"sources": []
				},
				{
					"kind": "warning",
					"title": "Dangerous medical suggestion framed as a question",
					"quote": "And is there a way we can do something like that, by injection inside or almost a cleaning?",
					"explanation": "The rhetoric frames an extreme medical intervention (injection/internal use of disinfectant) as a plausible option, which can mislead audiences even if phrased as a question. This functions as emotional/cognitive exploitation by normalizing harmful ideas.",
					"verdict": "Technique identified",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Verbatim briefing remark transcribed by FactCheck.org. The extension flags the dangerous medical suggestion as a manipulation technique."
	},
	{
		"id": "ev-09",
		"outcome": "true-positive",
		"text": "They are using HAARP to ensure that HURRICANE HELENE devastates the largest Republican stronghold area in Florida.",
		"source": {
			"title": "Reuters Fact Check — HAARP did not modify weather to create Hurricane Helene or Milton",
			"url": "https://www.reuters.com/fact-check/haarp-did-not-modify-weather-create-hurricane-helene-or-milton-2024-10-14/"
		},
		"context": "After Hurricanes Helene and Milton in 2024, viral posts claimed the HAARP research program was used to steer the storms at Republican areas. HAARP, NOAA and hurricane experts confirmed no technology can create or steer hurricanes. This is the post text quoted by Reuters.",
		"postDate": "2024-10",
		"platform": "Facebook",
		"category": "Propaganda device",
		"analysis": {
			"summary": "The post claims that HAARP is being used to ensure Hurricane Helene devastates Florida’s largest Republican stronghold area. This is an unverified conspiracy-style assertion that attributes a natural disaster to covert technological control rather than meteorological causes.",
			"findings": [
				{
					"kind": "fact",
					"title": "HAARP used to control hurricanes claim",
					"quote": "They are using HAARP to ensure that HURRICANE HELENE devastates",
					"explanation": "HAARP (often conflated with HAARP/High-frequency Active Auroral Research Program) is not capable of controlling hurricanes or directing them to specific locations. Hurricane formation and tracks are governed by atmospheric and ocean conditions, not radio-wave experiments.",
					"verdict": "Contradicted",
					"sources": [
						{
							"title": "NOAA explanation of hurricane formation and steering",
							"url": "https://www.noaa.gov/education/resource-collections/weather-climate/hurricanes"
						},
						{
							"title": "NASA/space science guidance on HAARP and misconceptions",
							"url": "https://science.nasa.gov/mission/haarp/"
						}
					]
				},
				{
					"kind": "warning",
					"title": "Conspiracy framing / hidden-actor attribution",
					"quote": "They are using HAARP",
					"explanation": "The post uses an unspecified “they” and a secret capability narrative to explain a complex real-world event, which is a common manipulation pattern in conspiracy content.",
					"verdict": "Technique identified",
					"sources": []
				},
				{
					"kind": "warning",
					"title": "Us-vs-them political targeting implication",
					"quote": "largest Republican stronghold area in Florida",
					"explanation": "By tying the alleged disaster-causing mechanism to a partisan geography, the post encourages political polarization and suggests intentional harm aimed at a political group.",
					"verdict": "Technique identified",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Real viral post quoted by Reuters. The extension contradicts the HAARP claim with NOAA/NASA sources and flags the conspiracy framing."
	},
	{
		"id": "ev-10",
		"outcome": "true-positive",
		"text": "If you have a windmill anywhere near your house, congratulations, your house just went down 75 percent in value. And they say the noise causes cancer.",
		"source": {
			"title": "FactCheck.org — Trump’s faulty wind power claims",
			"url": "https://www.factcheck.org/2019/04/trumps-faulty-wind-power-claims/"
		},
		"context": "At an April 2019 NRCC speech, President Trump claimed wind turbine noise causes cancer and slashes property values by 75%. The American Cancer Society found no credible evidence linking windmill noise to cancer. Verbatim quote as transcribed by FactCheck.org.",
		"postDate": "2019-04-02",
		"platform": "Public remarks",
		"category": "Deceptive framing",
		"analysis": {
			"summary": "The post claims that having a windmill near one’s house reduces the house value by 75% and asserts that windmill noise causes cancer. These are presented as definitive effects without any sourcing.",
			"findings": [
				{
					"kind": "fact",
					"title": "Unsubstantiated 75% home-value drop claim",
					"quote": "your house just went down 75 percent in value",
					"explanation": "A specific 75% figure is asserted as a general rule, but the claim is not supported with any source and is unlikely to be universally true. Real-world studies typically find mixed or small effects that vary by context rather than a blanket 75% drop.",
					"verdict": "Needs independent verification",
					"sources": []
				},
				{
					"kind": "fact",
					"title": "Noise causing cancer claim",
					"quote": "And they say the noise causes cancer.",
					"explanation": "The post implies wind turbine noise causes cancer. Major public-health and scientific bodies have not established a causal link between wind turbine noise and cancer.",
					"verdict": "Contradicted",
					"sources": [
						{
							"title": "WHO fact sheet on environmental noise and health (no cancer causal link)",
							"url": "https://www.who.int/news-room/fact-sheets/detail/noise-and-health"
						},
						{
							"title": "U.S. CDC: Wind turbines and health (addresses noise; no cancer causal conclusion)",
							"url": "https://www.cdc.gov/niosh/topics/windturbines/default.html"
						}
					]
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Verbatim remark transcribed by FactCheck.org. The extension contradicts the cancer claim with WHO/CDC sources."
	},
	{
		"id": "ev-11",
		"outcome": "true-positive",
		"text": "Illegal immigrants get BOTH social security numbers AND Social Security BENEFITS!! This massive story has been BURIED by the mainstream media!!",
		"source": {
			"title": "FactCheck.org — Posts misrepresent immigrants’ eligibility for Social Security numbers, benefits",
			"url": "https://www.factcheck.org/2024/04/posts-misrepresent-immigrants-eligibility-for-social-security-numbers-benefits/"
		},
		"context": "An April 2024 Facebook post claimed undocumented immigrants receive both Social Security numbers and benefits, alleging the media “buried” the story. FactCheck.org rated the claim false; noncitizens generally cannot collect Social Security benefits. Verbatim post text as archived by FactCheck.org.",
		"postDate": "2024-04-12",
		"platform": "Facebook",
		"category": "Smears",
		"analysis": {
			"summary": "The post claims that illegal immigrants receive both Social Security numbers and Social Security benefits, and it alleges that mainstream media has buried a “massive story.” No images are provided, and the post does not cite any specific evidence or source.",
			"findings": [
				{
					"kind": "fact",
					"title": "Claim about illegal immigrants receiving Social Security numbers and benefits",
					"quote": "Illegal immigrants get BOTH social security numbers AND Social Security BENEFITS!!",
					"explanation": "This is a concrete factual claim about eligibility and access to Social Security numbers and benefits. In general, Social Security numbers are issued under specific legal criteria, and Social Security benefits are tied to eligibility rules; the post provides no sourcing or details to substantiate the sweeping assertion.",
					"verdict": "Needs independent verification",
					"sources": []
				},
				{
					"kind": "warning",
					"title": "Mainstream media “buried the story” allegation",
					"quote": "This massive story has been BURIED by the mainstream media!!",
					"explanation": "The post uses a conspiracy-style framing (“buried”) to encourage distrust and rapid acceptance without evidence. This is a rhetorical manipulation signal rather than a verifiable claim as written.",
					"verdict": "Technique identified",
					"sources": []
				},
				{
					"kind": "warning",
					"title": "Urgency/alarm and loaded emphasis",
					"quote": "BOTH social security numbers AND Social Security BENEFITS!!",
					"explanation": "The all-caps, exclamation-heavy phrasing and paired absolutes (“BOTH…AND…”) are designed to intensify emotional impact and imply certainty without providing proof.",
					"verdict": "Technique identified",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Real viral post archived by FactCheck.org. The extension flags the scapegoating smear and the “buried by media” conspiracy framing."
	},
	{
		"id": "ev-12",
		"outcome": "true-negative",
		"text": "The OSIRIS-REx Sample Analysis Team found that Bennu contains the original ingredients that formed our solar system. The findings do not show evidence for life itself, but they do suggest the conditions necessary for the emergence of life were widespread across the early solar system.",
		"source": {
			"title": "NASA — Asteroid Bennu sample reveals mix of life’s ingredients",
			"url": "https://www.nasa.gov/news-release/nasas-asteroid-bennu-sample-reveals-mix-of-lifes-ingredients/"
		},
		"context": "NASA’s official summary of OSIRIS-REx sample analysis, describing the primitive ingredients found in asteroid Bennu. A legitimate scientific announcement with no manipulation. The extension verified the claims against NASA sources and alleged no manipulation.",
		"postDate": "2024-01",
		"platform": "NASA",
		"category": "Legitimate content",
		"analysis": {
			"summary": "The post claims NASA’s OSIRIS-REx Sample Analysis Team found that asteroid Bennu contains “the original ingredients” that formed the solar system, and that results show no evidence for life but suggest life-emergence conditions were widespread in the early solar system. This is broadly consistent with NASA’s public descriptions of Bennu’s organic-rich, carbonaceous material and the mission’s conclusions, though the wording “original ingredients” is somewhat interpretive rather than a precise scientific statement.",
			"findings": [
				{
					"kind": "fact",
					"title": "Bennu contains organic-rich material consistent with early solar system chemistry",
					"quote": "Bennu contains the original ingredients that formed our solar system.",
					"explanation": "NASA reporting on Bennu’s sample indicates it contains organic compounds and hydrated minerals, supporting that it preserves material from the early solar system. The phrase “original ingredients” is not a formal measurement term, but the underlying claim aligns with the mission’s findings.",
					"verdict": "Verified",
					"sources": [
						{
							"title": "NASA OSIRIS-REx mission overview (sample results context)",
							"url": "https://science.nasa.gov/mission/osiris-rex/"
						}
					]
				},
				{
					"kind": "fact",
					"title": "No evidence for life; conditions for life’s emergence may have been widespread",
					"quote": "The findings do not show evidence for life itself, but they do suggest the conditions necessary for the emergence of life were widespread across the early solar system.",
					"explanation": "OSIRIS-REx results have been communicated as not finding evidence of life, while highlighting that the presence of organics and water-related chemistry implies potentially favorable prebiotic conditions. The “widespread” inference is a reasonable extrapolation from chemistry, but it is still an interpretation rather than a direct measurement of where life emerged.",
					"verdict": "Verified",
					"sources": [
						{
							"title": "NASA OSIRIS-REx sample analysis results (public communications)",
							"url": "https://www.nasa.gov/osiris-rex/"
						}
					]
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Legitimate NASA announcement. The extension verified both claims against NASA sources and alleged no manipulation — a true negative."
	},
	{
		"id": "ev-13",
		"outcome": "true-negative",
		"text": "CDC recommends annual receipt of an age-appropriate influenza vaccine by all eligible persons aged 6 months and older as long as influenza viruses continue to circulate locally.",
		"source": {
			"title": "CDC — Prevention and control of seasonal influenza with vaccines (ACIP recommendations)",
			"url": "https://www.cdc.gov/mmwr/volumes/73/rr/rr7305a1.htm"
		},
		"context": "Official CDC/ACIP guidance recommending annual flu vaccination for everyone 6 months and older. A legitimate public-health statement. The extension verified the recommendation against CDC sources and alleged no manipulation.",
		"postDate": "2024",
		"platform": "CDC",
		"category": "Legitimate content",
		"analysis": {
			"summary": "The post claims that the CDC recommends annual, age-appropriate influenza vaccination for all eligible people aged 6 months and older as long as flu viruses are circulating locally. This is consistent with CDC guidance on annual flu vaccination for eligible ages.",
			"findings": [
				{
					"kind": "fact",
					"title": "CDC annual flu vaccination recommendation for ages 6 months+",
					"quote": "CDC recommends annual receipt of an age-appropriate influenza vaccine by all eligible persons aged 6 months and older",
					"explanation": "CDC guidance states that people aged 6 months and older should get a flu vaccine every season, and vaccination is recommended while flu viruses are circulating.",
					"verdict": "Verified",
					"sources": [
						{
							"title": "CDC — Seasonal Flu Vaccine Guidance",
							"url": "https://www.cdc.gov/flu/prevent/vaccinations.htm"
						}
					]
				},
				{
					"kind": "fact",
					"title": "Vaccination recommended while influenza viruses continue to circulate locally",
					"quote": "as long as influenza viruses continue to circulate locally",
					"explanation": "CDC notes that flu vaccination is recommended throughout the flu season and that people can still get vaccinated even after the season has started, as long as flu viruses are circulating.",
					"verdict": "Verified",
					"sources": [
						{
							"title": "CDC — Seasonal Flu Vaccine Guidance",
							"url": "https://www.cdc.gov/flu/prevent/vaccinations.htm"
						}
					]
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Legitimate CDC guidance. The extension verified the recommendation and alleged no manipulation — a true negative."
	},
	{
		"id": "ev-14",
		"outcome": "true-negative",
		"text": "The Federal Reserve left its benchmark interest rate unchanged at its January meeting, holding the federal funds rate in a target range of 5.25 to 5.5 percent.",
		"source": {
			"title": "Federal Reserve — FOMC statement, January 31, 2024",
			"url": "https://www.federalreserve.gov/newsevents/pressreleases/monetary20240131a.htm"
		},
		"context": "The Federal Reserve’s January 31, 2024 FOMC statement, which maintained the federal funds rate target range at 5¼ to 5½ percent. A legitimate monetary-policy statement. The extension asked for verification of the date but alleged no manipulation.",
		"postDate": "2024-01-31",
		"platform": "Federal Reserve",
		"category": "Legitimate content",
		"analysis": {
			"summary": "The post claims that the Federal Reserve left its benchmark interest rate unchanged at its January meeting, keeping the federal funds rate target range at 5.25% to 5.5%. Verification is needed because the claim depends on which specific January meeting (year) is being referenced and the Fed’s actual target range decision for that date.",
			"findings": [
				{
					"kind": "fact",
					"title": "Federal funds target range held at 5.25%–5.5% in January meeting",
					"quote": "holding the federal funds rate in a target range of 5.25 to 5.5 percent.",
					"explanation": "This is a specific, checkable monetary-policy claim, but the post does not specify the year of the January meeting. The Fed’s target range has changed over time, so the claim must be matched to the correct January FOMC decision date.",
					"verdict": "Needs independent verification",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Legitimate Federal Reserve statement. The extension requested date verification but alleged no manipulation — a true negative."
	},
	{
		"id": "ev-15",
		"outcome": "true-negative",
		"text": "The World Health Organization declared that mpox no longer constitutes a public health emergency of international concern.",
		"source": {
			"title": "UN News — WHO declares mpox emergency over but says threat remains (May 11, 2023)",
			"url": "https://news.un.org/en/story/2023/05/1136577"
		},
		"context": "On May 11, 2023, the WHO Director-General declared the mpox outbreak no longer constituted a Public Health Emergency of International Concern. A legitimate public-health announcement. The extension asked for verification but alleged no manipulation.",
		"postDate": "2023-05-11",
		"platform": "WHO",
		"category": "Legitimate content",
		"analysis": {
			"summary": "The post claims that WHO declared mpox no longer a Public Health Emergency of International Concern (PHEIC). This is a checkable factual assertion about WHO’s emergency status decision.",
			"findings": [
				{
					"kind": "fact",
					"title": "WHO mpox PHEIC status claim",
					"quote": "The World Health Organization declared that mpox no longer constitutes a public health emergency of international concern.",
					"explanation": "WHO’s PHEIC status for mpox has changed over time; verifying whether WHO has specifically declared it no longer constitutes a PHEIC requires checking WHO’s official emergency committee statements and WHO announcements.",
					"verdict": "Needs independent verification",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Legitimate WHO announcement. The extension requested verification but alleged no manipulation — a true negative."
	},
	{
		"id": "ev-16",
		"outcome": "false-positive",
		"text": "The November 3rd election was the most secure in American history. There is no evidence that any voting system deleted or lost votes, changed votes, or was in any way compromised.",
		"source": {
			"title": "CISA — Joint statement from Elections Infrastructure Government Coordinating Council",
			"url": "https://www.cisa.gov/news-events/news/joint-statement-elections-infrastructure-government-coordinating-council-election-infrastructure"
		},
		"context": "A November 12, 2020 joint statement by the Elections Infrastructure Government Coordinating Council (coordinated by CISA) affirming the 2020 election’s security. A legitimate, authoritative government statement. The extension incorrectly flagged it as “Misleading” — a false positive.",
		"postDate": "2020-11-12",
		"platform": "CISA",
		"category": "Legitimate content",
		"analysis": {
			"summary": "The post claims that the November 3 U.S. election was the “most secure in American history” and asserts there is no evidence of voting-system deletion/loss of votes, vote changes, or any compromise. It provides no sources or evidence within the text, and the claims are broad and absolute.",
			"findings": [
				{
					"kind": "fact",
					"title": "Absolute claim of “no evidence” of voting-system compromise",
					"quote": "There is no evidence that any voting system deleted or lost votes, changed votes, or was in any way compromised.",
					"explanation": "This is an absolute, sweeping assertion about the absence of evidence across all voting systems and all forms of compromise. Even if large-scale fraud was not established, the claim as written is too categorical to be reliably supported without specific, sourced findings.",
					"verdict": "Needs independent verification",
					"sources": []
				},
				{
					"kind": "technique",
					"title": "Overgeneralization / unfalsifiable certainty",
					"quote": "The November 3rd election was the most secure in American history.",
					"explanation": "“Most secure in American history” is a comparative superlative that implies a comprehensive measurement across time, but no methodology, metrics, or sources are provided. This functions as misleading certainty rather than a checkable claim.",
					"verdict": "Misleading",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Legitimate CISA government statement. The extension flagged the superlative phrasing as “Misleading” — a false positive on an authoritative, accurate statement."
	},
	{
		"id": "ev-17",
		"outcome": "false-negative",
		"text": "President Biden has created more jobs in his first 7 months than any president in history.",
		"source": {
			"title": "PolitiFact — Biden has overseen a large increase in jobs, but he’s not really ‘creating’ them",
			"url": "https://politifact.com/factchecks/2021/sep/21/gwen-moore/biden-has-overseen-large-increase-jobs-hes-not-rea/"
		},
		"context": "A claim repeated by supporters in 2021 that Biden “created more jobs in his first 7 months than any president in history.” PolitiFact rated it Half True: the raw number was high, but most reflected pandemic-recovery rebound rather than new job creation, and the framing overstates presidential credit. A genuinely misleading claim the extension did not flag as manipulation.",
		"postDate": "2021-09",
		"platform": "X",
		"category": "Deceptive framing",
		"analysis": {
			"summary": "The post claims that President Biden created more jobs in his first 7 months than any president in history. This is a specific comparative statistic that depends on how “created jobs” is defined and which presidents/periods are being compared.",
			"findings": [
				{
					"kind": "fact",
					"title": "Unverified comparative jobs claim",
					"quote": "President Biden has created more jobs in his first 7 months than any president in history.",
					"explanation": "This is a concrete, cross-administration comparison that requires a specific dataset (e.g., BLS payroll employment changes), a defined start/end window, and a consistent method across presidents. Without those details, the claim is not verifiable as stated and is likely misleading.",
					"verdict": "Needs independent verification",
					"sources": []
				}
			],
			"actorContext": ""
		},
		"verified": true,
		"notes": "Real misleading claim rated Half True by PolitiFact (pandemic-recovery rebound, overstated credit). The extension only requested verification and alleged no manipulation technique — a false negative."
	}
];
