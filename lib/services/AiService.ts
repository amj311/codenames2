
import axios from "axios";


const getHintPrompt = (teamWords, opposingWords) => `
You are playing a game of 'Codenames' where you must help your team guess their own words without guessing any of your opponent's words.
You help your team by giving a one-word hint that relates conceptually to a few of your team's words, but does NOT relate to any of the opponent's words.
Your hint MAY NOT be any of the words on the board.

Here is the list of our team's words:
${teamWords.join("\n")}


Here are the opposing words:
${opposingWords.join("\n")}


Please return ONLY a JSON formatted object with these properties:
{
  "hint": "the hint you choose",
}
`;

const getMatchingWordsPrompt = (hint, teamWords) => `
You are playing a game of 'Codenames' where you must help your team guess their own words without guessing any of your opponent's words.
You help your team by giving a one-word hint that relates conceptually to a few of your team's words, but does NOT relate to any of the opponent's words.

You have already chosen this hint:
${hint}


No, please select one or more words that are VERY STRONGLY related to the hint.

Here is the list of our team's words:
${teamWords.join("\n")}


Please return ONLY a JSON formatted object with these properties:
{
  "matchingWords": [ "word1", ... ]
}
`;

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
  async getHint(teamWords, opposingWords) {
    const { success: hintSuccess, response: hintResponse } = await promptAi(getHintPrompt(teamWords, opposingWords));
    if (!hintSuccess) return { success: false };
    const { success: matchingWordsSuccess, response: matchingWordsResponse } = await promptAi(getMatchingWordsPrompt(hintResponse.hint, teamWords));
    if (!matchingWordsSuccess) return { success: false };
    return {
      success: true,
      response: {
        hint: hintResponse.hint,
        matchingWords: matchingWordsResponse.matchingWords
      }
    };
  }
};
