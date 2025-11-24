// voiceNavigationController.js
// Voice navigation system for accessibility

class VoiceNavigationController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.commands = new Map();
        this.highlightedElement = null;
        this.setupRecognition();
        this.registerDefaultCommands();
    }

    setupRecognition() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('')
                .toLowerCase()
                .trim();

            // Only process final results
            if (event.results[event.results.length - 1].isFinal) {
                this.processCommand(transcript);
                this.showFeedback(transcript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                // Auto-restart if no speech detected
                setTimeout(() => this.start(), 100);
            }
        };

        this.recognition.onend = () => {
            // Auto-restart if still supposed to be listening
            if (this.isListening) {
                setTimeout(() => this.recognition.start(), 100);
            }
        };
    }

    registerDefaultCommands() {
        // Navigation commands
        this.registerCommand(['go to menu', 'menu', 'show menu'], () => {
            window.location.href = '/menu';
        });

        this.registerCommand(['go to orders', 'orders', 'show orders'], () => {
            window.location.href = '/orders';
        });

        this.registerCommand(['go to employees', 'employees'], () => {
            window.location.href = '/employees';
        });

        this.registerCommand(['go to inventory', 'inventory'], () => {
            window.location.href = '/inventory';
        });

        this.registerCommand(['go to reports', 'reports'], () => {
            window.location.href = '/reports';
        });

        this.registerCommand(['go home', 'home'], () => {
            window.location.href = '/';
        });

        // Scroll commands
        this.registerCommand(['scroll down', 'down'], () => {
            window.scrollBy({ top: 300, behavior: 'smooth' });
        });

        this.registerCommand(['scroll up', 'up'], () => {
            window.scrollBy({ top: -300, behavior: 'smooth' });
        });

        this.registerCommand(['scroll to top', 'top'], () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        this.registerCommand(['scroll to bottom', 'bottom'], () => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });

        // Click commands - clicks highlighted or focused element
        this.registerCommand(['click', 'select', 'choose', 'confirm'], () => {
            const element = this.highlightedElement || document.activeElement;
            if (element && element !== document.body) {
                element.click();
                this.speak('Selected');
            }
        });

        // Cancel/back commands
        this.registerCommand(['cancel', 'back', 'go back'], () => {
            window.history.back();
        });

        // Next/previous element navigation
        this.registerCommand(['next', 'next item'], () => {
            this.focusNextElement();
        });

        this.registerCommand(['previous', 'previous item'], () => {
            this.focusPreviousElement();
        });
    }

    registerCommand(phrases, callback) {
        phrases.forEach(phrase => {
            this.commands.set(phrase.toLowerCase(), callback);
        });
    }

    processCommand(transcript) {
        console.log('Processing command:', transcript);

        // Check for exact matches first
        if (this.commands.has(transcript)) {
            this.commands.get(transcript)();
            return;
        }

        // Check for partial matches (e.g., "click menu button")
        for (const [command, callback] of this.commands) {
            if (transcript.includes(command)) {
                callback();
                return;
            }
        }

        // Try to find and click elements by text content
        if (transcript.startsWith('click ') || transcript.startsWith('select ')) {
            const targetText = transcript.replace(/^(click|select)\s+/, '');
            this.clickElementByText(targetText);
            return;
        }

        // If no command matched, provide feedback
        this.speak('Command not recognized');
    }

    clickElementByText(text) {
        // Find all clickable elements
        const clickableElements = document.querySelectorAll(
            'button, a, [role="button"], input[type="submit"], input[type="button"]'
        );

        for (const element of clickableElements) {
            const elementText = element.textContent.toLowerCase().trim();
            if (elementText.includes(text) || text.includes(elementText)) {
                this.highlightElement(element);
                setTimeout(() => {
                    element.click();
                    this.speak('Clicked ' + elementText);
                }, 300);
                return;
            }
        }

        this.speak('Element not found');
    }

    focusNextElement() {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % focusableElements.length;

        if (focusableElements[nextIndex]) {
            focusableElements[nextIndex].focus();
            this.highlightElement(focusableElements[nextIndex]);
            this.speak(focusableElements[nextIndex].textContent.substring(0, 30));
        }
    }

    focusPreviousElement() {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement);
        const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;

        if (focusableElements[prevIndex]) {
            focusableElements[prevIndex].focus();
            this.highlightElement(focusableElements[prevIndex]);
            this.speak(focusableElements[prevIndex].textContent.substring(0, 30));
        }
    }

    getFocusableElements() {
        return Array.from(document.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.disabled && el.offsetParent !== null);
    }

    highlightElement(element) {
        // Remove previous highlight
        if (this.highlightedElement) {
            this.highlightedElement.style.outline = '';
            this.highlightedElement.style.boxShadow = '';
        }

        // Add new highlight
        this.highlightedElement = element;
        element.style.outline = '3px solid #4CAF50';
        element.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showFeedback(transcript) {
        // Visual feedback for speech recognition
        const feedback = document.getElementById('voice-feedback') || this.createFeedbackElement();
        feedback.textContent = transcript;
        feedback.style.opacity = '1';

        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 2000);
    }

    createFeedbackElement() {
        const feedback = document.createElement('div');
        feedback.id = 'voice-feedback';
        feedback.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 16px;
      z-index: 10000;
      transition: opacity 0.3s;
      max-width: 300px;
    `;
        document.body.appendChild(feedback);
        return feedback;
    }

    speak(text) {
        // Text-to-speech feedback
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }

    start() {
        if (!this.recognition) {
            console.error('Speech recognition not available');
            return;
        }

        this.isListening = true;
        try {
            this.recognition.start();
            console.log('Voice navigation started');
            this.createStatusIndicator();
        } catch (e) {
            console.error('Error starting recognition:', e);
        }
    }

    stop() {
        this.isListening = false;
        if (this.recognition) {
            this.recognition.stop();
            console.log('Voice navigation stopped');
        }
        this.removeStatusIndicator();
    }

    createStatusIndicator() {
        if (document.getElementById('voice-status')) return;

        const indicator = document.createElement('div');
        indicator.id = 'voice-status';
        indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 10px 15px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      ">
        <span style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        "></span>
        Voice Control Active
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      </style>
    `;
        document.body.appendChild(indicator);
    }

    removeStatusIndicator() {
        const indicator = document.getElementById('voice-status');
        if (indicator) {
            indicator.remove();
        }
    }
}

export default VoiceNavigationController;