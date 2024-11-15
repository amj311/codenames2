import words from '../../words/easy_rel.json' assert { type: 'json' }

export default class WordListService {
  constructor() { }

  getWordList() {
    return words.words
  }
}
