import { readFileSync } from 'fs';
import { DefaultWordDecks } from '../constants';

export default class WordListService {
  constructor() { }

  getWordList(deckName: string, customWordsTxt: string = '') {
    try {
      const wordsTxt = customWordsTxt || this.loadWordFile(deckName);
      return this.parseTxt(wordsTxt);
    } catch (e) {
      console.log('Error:', e.stack);
      return [];
    }
  }

  loadWordFile(deckName: string): string {
    try {
      const knownDeck = DefaultWordDecks.find(deck => deck.name === deckName);
      if (!knownDeck) {
        throw new Error(`Unknown deck: ${deckName}`);
      }
      return readFileSync(`./words/${knownDeck.file}`, 'utf8');
    } catch (e) {
      console.log('Error:', e.stack);
      return '';
    }
  }

  parseTxt(txt: string): string[] {
    return txt.replace(/\n+/g, ',').replace(/,[, ]+/g, ',').split(/ *, */g);
  }
}

// (async () => {
//   const wordService = new WordListService();
//   try {
//     const data = readFileSync('./words/LDS_Easy.txt', 'utf8');
//     console.log(data.toString().replace(/\n+/g, ',').replace(/,[, ]+/g, ',').split(/ *, */g));

//     console.log(wordService.getWordList('LDS - Easy'));
//   } catch (e) {
//     console.log('Error:', e.stack);
//   }
// })();

