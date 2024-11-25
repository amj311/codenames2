
import axios from "axios";


const getHintPrompt = (teamWords, opposingWords, previousHint = '', badHints: string[] = []) => `
You are playing a game of 'Codenames' where you must help your team guess their own words without guessing any of your opponent's words.
You help your team by giving a one-word hint that relates conceptually to a few of your team's words, but does NOT relate to any of the opponent's words.
Your hint MAY NOT be any of the words on the board.
Avoid using the opposite of a word as a hint to it, as that doesn't usually go well.

${previousHint ? `You have already chosen this hint and should not repeat it: ${previousHint}` : ''}

${badHints.length ? `Another AI assistant has determined that these hints are not good enough and should not be repeated: "${badHints.join(", ")}"` : ''}

Here is the list of our team's words:
${teamWords.join("\n")}


Here are the opposing words:
${opposingWords.join("\n")}

Keep these guidelines in mind:
- You get more points for linking multiple words together so try hint at at LEAST 2 or more words when possible.
- You lose points for guessing opposing words so AVOID hints that could be connected to an opposing word.

Now please choose a one-word hint and words. Please include a simple explanation of how your words are related to the hint.

Please return ONLY a JSON formatted object with these properties:
{
  "hint": string,
  "explanation": string,
  "matchingWords": string[], // only words from the board, no explanation here
}

DO NOT put anything other than words from the game board in the "matchingWords" array.
`;


const checkHintPrompt = (hint, matchingWords, opposingWords) => `
You are playing a game of 'Codenames' where you must help your team guess their own words without guessing any of your opponent's words.
You help your team by giving a one-word hint that relates conceptually to a few of your team's words, but does NOT relate to any of the opponent's words.

You have already chosen this hint:
${hint}
You said the hint ws related to these words:
${matchingWords.join("\n")}

Now please tell me if the hint could be MORE related to any of the opponent's words than the words you said OR if your hint is does not strongly match any of the related words.
If there is a very loose connection to the opponent's words, but a much stronger connection to your team's words, please return true.
If a team member could mistakenly choose one of these words by the hint, please return false.
If you think that your hint was too vaguely related to your own matching words, please return false.

Here are the opponent's words:
${opposingWords.join("\n")}


Please return ONLY a JSON formatted object with these properties:
{
  "goodHint": boolean,
  "explanation": string
}
`;

// const getMatchingWordsPrompt = (hint, teamWords) => `
// You are playing a game of 'Codenames' where you must help your team guess their own words without guessing any of your opponent's words.
// You help your team by giving a one-word hint that relates conceptually to a few of your team's words, but does NOT relate to any of the opponent's words.

// You have already chosen this hint:
// ${hint}


// Now, please select one or more words that are VERY STRONGLY related to the hint.
// Try not to count opposites as matches, as that doesn't usually go well.

// Here is the list of our team's words:
// ${teamWords.join("\n")}


// Please return ONLY a JSON formatted object with these properties:
// {
//   "matchingWords": string[],
//   "explanation": string
// }

// `;

async function promptAi(prompt) {
	let response;
	let success = false;

	try {
		const { data } = await axios.post(
			"https://api.groq.com/openai/v1/chat/completions",
			{
				model: "llama-3.1-70b-versatile",
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.7,
				max_tokens: 256,
				top_p: 0.5,
				response_format: {
					type: "json_object",
				},
			},
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.GROQ_SK}`,
				},
			}
		);
		response = JSON.parse(data.choices[0].message.content);
		success = true;
	}
	catch (e) {
		if (e.response) {
			console.error(e.response.data.error);
		}
		else {
			console.error(e);
		}
	}
	return {
		success,
		response
	};
}

export const AiService = {
	async getHint(teamWords, opposingWords, previousHint = '') {
		let { success: hintSuccess, response: hintResponse } = await promptAi(getHintPrompt(teamWords, opposingWords, previousHint));
		if (!hintSuccess) return { success: false };

		const badHints = [] as string[];
		let retryCount = 0;
		do {
			// do type check
			if (
				!hintResponse.hint ||
				!hintResponse.explanation ||
				!hintResponse.matchingWords ||
				!Array.isArray(hintResponse.matchingWords) ||
				typeof hintResponse.hint !== "string"
			) {
				console.log("AI return bad response!", hintResponse);
				retryCount++;
				break;
			}

			for (const matchingWords of hintResponse.matchingWords) {
				if (!hintResponse.matchingWords.find(w => teamWords.find(w2 => w2.toLowerCase() === w.toLowerCase()))) {
					console.log("AI return a word not in the team words!", matchingWords, teamWords);
					badHints.push(hintResponse.hint);
					break;
				}
			}

			const { success: checkHintSuccess, response: checkHintResponse } = await promptAi(checkHintPrompt(hintResponse.hint, hintResponse.matchingWords, opposingWords));
			if (!checkHintSuccess) return { success: false };
			if (checkHintResponse.goodHint) break;

			console.log(`Bad hint: ${hintResponse.hint}, explanation: ${checkHintResponse.explanation}. Will re-prompt.`);
			badHints.push(hintResponse.hint);
			({ success: hintSuccess, response: hintResponse } = await promptAi(getHintPrompt(teamWords, opposingWords, previousHint, badHints)));
			if (!hintSuccess) return { success: false };
			console.log(`New hint: ${hintResponse.hint}`);
		} while (badHints.length < 5 && retryCount < 10);

		// const { success: matchingWordsSuccess, response: matchingWordsResponse } = await promptAi(getMatchingWordsPrompt(hintResponse.hint, teamWords));
		// if (!matchingWordsSuccess) return { success: false };
		return {
			success: true,
			response: {
				hint: hintResponse.hint,
				matchingWords: hintResponse.matchingWords,
				explanation: hintResponse.explanation,
			}
		};
	}
};
