// voiceNavigationController.js
class VoiceNavigationController {
    constructor() {
        if (window.__voiceNavInstance) {
            return window.__voiceNavInstance;
        }

        this.recognition = null;
        this.isListening = false;
        this.commands = new Map();
        this.highlightedElement = null;

        this.setupRecognition();

        // IMPORTANT: register AFTER speech recognition initializes
        setTimeout(() => this.registerDefaultCommands(), 10);

        window.__voiceNavInstance = this;
    }

    setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error("Speech recognition not supported");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = "en-US";

        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript
                .toLowerCase()
                .trim();

            this.showFeedback(transcript);
            this.processCommand(transcript);
        };

        this.recognition.onerror = () => { };
        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };
    }

    registerDefaultCommands() {
        // REAL ROUTES FROM YOUR App.js
        this.registerCommand(["go to home", "home"], () => this.navigate("/"));
        this.registerCommand(["go to manager", "manager"], () => this.navigate("/manager"));
        this.registerCommand(["go to kiosk", "kiosk"], () => this.navigate("/kiosk"));
        this.registerCommand(["go to cashier", "cashier"], () => this.navigate("/cashier"));
        this.registerCommand(["go to menu", "menu"], () => this.navigate("/menu"));

        this.registerCommand(["go to employees", "employees"], () =>
            this.navigate("/manager/employees")
        );
        this.registerCommand(["go to ingredients", "ingredients", "inventory"], () =>
            this.navigate("/manager/ingredients")
        );
        this.registerCommand(["go to sales", "sales"], () =>
            this.navigate("/manager/sales")
        );
        this.registerCommand(["go to items", "items"], () =>
            this.navigate("/manager/items")
        );
        this.registerCommand(["log out", "logout", "sign out"], () => {
            sessionStorage.removeItem("user");
            this.navigate("/login");
        });

        // SCROLLING
        this.registerCommand(["scroll down"], () => window.scrollBy({ top: 300, behavior: "smooth" }));
        this.registerCommand(["scroll up"], () => window.scrollBy({ top: -300, behavior: "smooth" }));

        // CLICK ACTION
        this.registerCommand(["click", "select", "confirm"], () => {
            const el = this.highlightedElement || document.activeElement;
            if (el) {
                el.click();
                this.speak("selected");
            }
        });

        // FOCUSING MOVEMENT
        this.registerCommand(["next"], () => this.moveFocus(1));
        this.registerCommand(["previous"], () => this.moveFocus(-1));
    }

    navigate(path) {
        // Correct navigation in React Router
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
    }

    registerCommand(phrases, callback) {
        phrases.forEach((p) => this.commands.set(p, callback));
    }

    processCommand(transcript) {
        // exact match
        if (this.commands.has(transcript)) {
            this.commands.get(transcript)();
            return;
        }

        // partial match
        for (const [cmd, cb] of this.commands) {
            if (transcript.includes(cmd)) {
                cb();
                return;
            }
        }

        // click something by name
        if (transcript.startsWith("click ") || transcript.startsWith("select")) {
            const targetText = transcript.replace(/^(click|select)\s+/, "");
            this.clickElementByText(targetText);
            return;
        }

        this.speak("not recognized");
    }

    clickElementByText(text) {
        const elements = document.querySelectorAll(
            "button, a, [role='button'], input[type='button'], input[type='submit']"
        );

        text = text.toLowerCase();

        // FIX: more flexible matching so “kiosk”, “enter kiosk”, “kiosk page” will work
        for (const el of elements) {
            const t = el.textContent.toLowerCase().trim();

            if (t.includes(text)) {
                this.highlightElement(el);
                setTimeout(() => el.click(), 150);
                this.speak("clicked " + t);
                return;
            }
        }

        this.speak("element not found");
    }

    getFocusableElements() {
        return Array.from(
            document.querySelectorAll(
                "button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])"
            )
        ).filter((el) => !el.disabled && el.offsetParent !== null);
    }

    moveFocus(direction) {
        const els = this.getFocusableElements();

        let idx = els.indexOf(document.activeElement);
        if (idx === -1) idx = 0;

        let target = els[(idx + direction + els.length) % els.length];

        target.focus();
        this.highlightElement(target);
    }

    highlightElement(el) {
        if (this.highlightedElement) {
            this.highlightedElement.style.outline = "";
            this.highlightedElement.style.boxShadow = "";
        }

        this.highlightedElement = el;

        el.style.outline = "3px solid #4CAF50";
        el.style.boxShadow = "0 0 10px rgba(76,175,80,0.6)";
        el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    showFeedback(text) {
        const feedback =
            document.getElementById("voice-feedback") || this.createFeedbackElement();

        feedback.textContent = text;
        feedback.style.opacity = "1";
        setTimeout(() => (feedback.style.opacity = "0"), 1200);
    }

    createFeedbackElement() {
        const el = document.createElement("div");
        el.id = "voice-feedback";
        el.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: black;
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(el);
        return el;
    }

    speak(text) {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }
    }

    start() {
        if (!this.recognition) return;
        this.isListening = true;
        this.recognition.start();
    }

    stop() {
        this.isListening = false;
        if (this.recognition) this.recognition.stop();
    }
}

export default VoiceNavigationController;
