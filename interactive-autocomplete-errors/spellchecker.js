// Simple spell checker with common misspellings
class SpellChecker {
    constructor() {
        // Dictionary of common misspellings -> correct spelling
        this.corrections = {
            // Russian
            'ошибкми': 'ошибками',
            'несколко': 'несколько',
            'неправильно': 'неправильно', // correct
            'интеактивно': 'интерактивно',
            'првет': 'привет',
            'спсибо': 'спасибо',
            'пжалуйста': 'пожалуйста',
            'сейчс': 'сейчас',
            'хорошо': 'хорошо', // correct
            'плохо': 'плохо', // correct

            // English
            'exmple': 'example',
            'erors': 'errors',
            'interctively': 'interactively',
            'teh': 'the',
            'recieve': 'receive',
            'occured': 'occurred',
            'begining': 'beginning',
            'writting': 'writing',
            'definately': 'definitely',
            'seperate': 'separate',
            'wierd': 'weird',
            'untill': 'until',
        };

        // Build reverse index for quick lookup
        this.knownWords = new Set(Object.values(this.corrections));
    }

    // Check a word and return correction if found
    checkWord(word) {
        const lowerWord = word.toLowerCase();
        if (this.corrections[lowerWord]) {
            return {
                original: word,
                correct: this.corrections[lowerWord],
                isError: true
            };
        }
        return {
            original: word,
            correct: word,
            isError: false
        };
    }

    // Find missing characters between original and correct
    findMissingChars(original, correct) {
        const missing = [];
        let origIdx = 0;
        let corrIdx = 0;

        while (corrIdx < correct.length) {
            if (origIdx < original.length &&
                original[origIdx].toLowerCase() === correct[corrIdx].toLowerCase()) {
                origIdx++;
                corrIdx++;
            } else {
                // Found a missing character
                missing.push({
                    char: correct[corrIdx],
                    position: origIdx,
                    displayPosition: corrIdx
                });
                corrIdx++;
            }
        }

        return missing;
    }

    // Calculate edit operations needed
    getEditOperations(original, correct) {
        original = original.toLowerCase();
        correct = correct.toLowerCase();

        const operations = [];
        let i = 0, j = 0;

        while (i < original.length || j < correct.length) {
            if (i < original.length && j < correct.length && original[i] === correct[j]) {
                i++;
                j++;
            } else if (j < correct.length && (i >= original.length || original[i] !== correct[j])) {
                // Character is missing in original (insertion needed)
                operations.push({
                    type: 'insert',
                    char: correct[j],
                    position: i
                });
                j++;
            } else if (i < original.length && (j >= correct.length || original[i] !== correct[j])) {
                // Extra character in original (deletion needed)
                operations.push({
                    type: 'delete',
                    char: original[i],
                    position: i
                });
                i++;
            }
        }

        return operations;
    }

    // Check entire text and return errors with positions
    checkText(text) {
        const errors = [];
        // Split by word boundaries but keep positions
        const wordRegex = /[\p{L}\p{N}]+/gu;
        let match;

        while ((match = wordRegex.exec(text)) !== null) {
            const word = match[0];
            const result = this.checkWord(word);

            if (result.isError) {
                const missing = this.findMissingChars(word, result.correct);
                errors.push({
                    original: word,
                    correct: result.correct,
                    start: match.index,
                    end: match.index + word.length,
                    missingChars: missing
                });
            }
        }

        return errors;
    }
}

// Export for use in app
window.SpellChecker = SpellChecker;
