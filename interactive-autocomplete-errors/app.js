// Main application logic
class InteractiveSpellCorrector {
    constructor() {
        this.spellChecker = new SpellChecker();
        this.errors = [];
        this.currentErrorIndex = -1;
        this.isActive = false;

        // DOM elements
        this.editor = document.getElementById('editor');
        this.checkBtn = document.getElementById('checkBtn');
        this.nextErrorBtn = document.getElementById('nextErrorBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.errorCount = document.getElementById('errorCount');
        this.currentError = document.getElementById('currentError');
        this.correctionHint = document.getElementById('correctionHint');
        this.hintText = document.getElementById('hintText');

        this.initEventListeners();
    }

    initEventListeners() {
        this.checkBtn.addEventListener('click', () => this.checkText());
        this.nextErrorBtn.addEventListener('click', () => this.goToNextError());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.checkText();
            } else if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                if (this.isActive) {
                    this.goToNextError();
                }
            }
        });

        // Monitor typing in editor
        this.editor.addEventListener('input', (e) => {
            if (this.isActive && this.currentErrorIndex >= 0) {
                this.checkCurrentCorrection();
            }
        });

        // Prevent default spell check
        this.editor.setAttribute('spellcheck', 'false');
    }

    checkText() {
        const text = this.editor.textContent;
        this.errors = this.spellChecker.checkText(text);

        this.errorCount.textContent = `Errors: ${this.errors.length}`;

        if (this.errors.length > 0) {
            this.isActive = true;
            this.nextErrorBtn.disabled = false;
            this.highlightErrors();
            this.goToNextError();
        } else {
            alert('No errors found! Great job!');
        }
    }

    highlightErrors() {
        const text = this.editor.textContent;
        let html = '';
        let lastIndex = 0;

        this.errors.forEach((error, index) => {
            // Add text before error
            html += this.escapeHtml(text.substring(lastIndex, error.start));

            // Add error with highlighting
            html += `<span class="error" data-error-index="${index}">${this.escapeHtml(error.original)}</span>`;

            lastIndex = error.end;
        });

        // Add remaining text
        html += this.escapeHtml(text.substring(lastIndex));

        this.editor.innerHTML = html;
    }

    goToNextError() {
        if (this.errors.length === 0) return;

        // Remove active class from previous error
        if (this.currentErrorIndex >= 0) {
            const prevError = this.editor.querySelector(`[data-error-index="${this.currentErrorIndex}"]`);
            if (prevError) {
                prevError.classList.remove('active');
            }
        }

        // Move to next error
        this.currentErrorIndex++;

        if (this.currentErrorIndex >= this.errors.length) {
            this.currentErrorIndex = 0;
        }

        const currentErrorData = this.errors[this.currentErrorIndex];
        const errorElement = this.editor.querySelector(`[data-error-index="${this.currentErrorIndex}"]`);

        if (errorElement) {
            errorElement.classList.add('active');

            // Show correction hint
            this.showCorrectionHint(currentErrorData);

            // Highlight missing characters
            this.highlightMissingChars(errorElement, currentErrorData);

            // Update stats
            this.currentError.textContent = `Current: ${this.currentErrorIndex + 1}/${this.errors.length}`;

            // Focus and place cursor
            this.focusOnError(errorElement);
        }
    }

    showCorrectionHint(error) {
        const missingChars = error.missingChars.map(m => m.char).join('');
        this.hintText.textContent = missingChars;
        this.correctionHint.style.display = 'block';
    }

    highlightMissingChars(element, error) {
        let html = '';
        let originalIdx = 0;
        const original = error.original;
        const correct = error.correct;

        for (let i = 0; i < correct.length; i++) {
            const isMissing = error.missingChars.some(m => m.displayPosition === i);

            if (isMissing) {
                html += `<span class="missing-char">${correct[i]}</span>`;
            } else {
                if (originalIdx < original.length) {
                    html += this.escapeHtml(original[originalIdx]);
                    originalIdx++;
                }
            }
        }

        element.innerHTML = html;
    }

    focusOnError(element) {
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Set cursor position at the error
        const range = document.createRange();
        const sel = window.getSelection();

        // Find the first missing char
        const missingChar = element.querySelector('.missing-char');
        if (missingChar) {
            range.setStart(missingChar, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        this.editor.focus();
    }

    checkCurrentCorrection() {
        const errorElement = this.editor.querySelector(`[data-error-index="${this.currentErrorIndex}"]`);
        if (!errorElement) return;

        const currentText = errorElement.textContent;
        const expectedText = this.errors[this.currentErrorIndex].correct;

        // Check if correction is complete
        if (currentText.toLowerCase() === expectedText.toLowerCase()) {
            // Success! Remove error styling and move to next
            errorElement.classList.remove('error', 'active');
            errorElement.removeAttribute('data-error-index');

            // Remove from errors array
            this.errors.splice(this.currentErrorIndex, 1);

            // Update error indices in DOM
            this.updateErrorIndices();

            // Update count
            this.errorCount.textContent = `Errors: ${this.errors.length}`;

            // Move to next error or finish
            if (this.errors.length > 0) {
                if (this.currentErrorIndex >= this.errors.length) {
                    this.currentErrorIndex = -1;
                } else {
                    this.currentErrorIndex--;
                }
                setTimeout(() => this.goToNextError(), 300);
            } else {
                this.finish();
            }
        }
    }

    updateErrorIndices() {
        const errorElements = this.editor.querySelectorAll('.error');
        errorElements.forEach((el, index) => {
            el.setAttribute('data-error-index', index);
        });
    }

    finish() {
        this.isActive = false;
        this.correctionHint.style.display = 'none';
        this.currentError.textContent = 'Current: -';
        this.nextErrorBtn.disabled = true;

        // Celebrate!
        setTimeout(() => {
            alert('🎉 Congratulations! All errors corrected!');
        }, 200);
    }

    reset() {
        this.errors = [];
        this.currentErrorIndex = -1;
        this.isActive = false;
        this.correctionHint.style.display = 'none';
        this.errorCount.textContent = 'Errors: 0';
        this.currentError.textContent = 'Current: -';
        this.nextErrorBtn.disabled = true;

        // Reset editor content to plain text
        const text = this.editor.textContent;
        this.editor.textContent = text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InteractiveSpellCorrector();
});
