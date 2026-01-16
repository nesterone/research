const { useState, useEffect, useRef } = React;

// Component definitions
const components = {
    editor: {
        keywords: ['редактор', 'editor', 'текстовый редактор', 'text editor'],
        render: (id) => (
            <div className="editor-component">
                <h3>Текстовый редактор</h3>
                <textarea placeholder="Начните печатать..."></textarea>
            </div>
        )
    },
    login: {
        keywords: ['логин', 'login', 'логин страницу', 'форма логина', 'авторизация', 'вход'],
        render: (id) => (
            <div className="login-component">
                <h2>Вход</h2>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" placeholder="your@email.com" />
                </div>
                <div className="form-group">
                    <label>Пароль</label>
                    <input type="password" placeholder="••••••••" />
                </div>
                <button>Войти</button>
            </div>
        )
    },
    button: {
        keywords: ['кнопка', 'button', 'кнопку'],
        render: (id) => (
            <div className="button-component">
                <button>Нажми меня</button>
            </div>
        )
    },
    card: {
        keywords: ['карточка', 'card', 'карточку'],
        render: (id) => (
            <div className="card-component">
                <h3>Заголовок карточки</h3>
                <p>Это пример карточки с контентом. Вы можете добавить сюда любую информацию.</p>
            </div>
        )
    }
};

// Position calculator
const getPosition = (index, position) => {
    const positions = {
        center: { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
        left: { left: '10%', top: '20%' },
        right: { right: '10%', top: '20%' },
        top: { left: '50%', top: '10%', transform: 'translateX(-50%)' }
    };

    if (position && positions[position]) {
        return positions[position];
    }

    // Default: cascade components
    const offset = index * 40;
    return {
        left: `${10 + offset}%`,
        top: `${10 + (offset * 0.5)}%`
    };
};

function App() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [componentsOnCanvas, setComponentsOnCanvas] = useState([]);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('К сожалению, ваш браузер не поддерживает голосовое распознавание. Попробуйте Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ru-RU';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setTranscript(interimTranscript || finalTranscript);

            if (finalTranscript) {
                processCommand(finalTranscript.toLowerCase());
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            if (isListening) {
                recognition.start(); // Restart if should still be listening
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, [isListening]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const processCommand = (command) => {
        console.log('Processing command:', command);

        // Check if command includes "сделай" or "нужен" to add component
        const isAddCommand = command.includes('сделай') ||
                            command.includes('нужен') ||
                            command.includes('нужна') ||
                            command.includes('создай') ||
                            command.includes('добавь');

        if (isAddCommand) {
            // Find matching component
            for (const [type, config] of Object.entries(components)) {
                const matches = config.keywords.some(keyword =>
                    command.includes(keyword.toLowerCase())
                );

                if (matches) {
                    addComponent(type);
                    break;
                }
            }
        }

        // Check for clear command
        if (command.includes('очисти') || command.includes('удали все') || command.includes('clear')) {
            clearCanvas();
        }
    };

    const addComponent = (type) => {
        const newComponent = {
            id: Date.now(),
            type,
            state: 'wireframe',
            position: getPosition(componentsOnCanvas.length)
        };

        setComponentsOnCanvas(prev => [...prev, newComponent]);

        // Transition from wireframe to styled after 1.5 seconds
        setTimeout(() => {
            setComponentsOnCanvas(prev =>
                prev.map(comp =>
                    comp.id === newComponent.id
                        ? { ...comp, state: 'styled' }
                        : comp
                )
            );
        }, 1500);
    };

    const removeComponent = (id) => {
        setComponentsOnCanvas(prev => prev.filter(comp => comp.id !== id));
    };

    const clearCanvas = () => {
        setComponentsOnCanvas([]);
    };

    return (
        <div className="app-container">
            <div className="canvas">
                {componentsOnCanvas.map(comp => {
                    const componentConfig = components[comp.type];
                    if (!componentConfig) return null;

                    return (
                        <div
                            key={comp.id}
                            className={`component component-appear ${comp.state}`}
                            style={comp.position}
                        >
                            <div className="component-controls">
                                <button
                                    className="delete-btn"
                                    onClick={() => removeComponent(comp.id)}
                                    title="Удалить"
                                >
                                    ×
                                </button>
                            </div>
                            {componentConfig.render(comp.id)}
                        </div>
                    );
                })}
            </div>

            <div className="control-panel">
                <button
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                    title={isListening ? 'Остановить' : 'Начать говорить'}
                >
                    {isListening ? '⏸' : '🎤'}
                </button>
                <div className="transcript">
                    {transcript || 'Нажмите на микрофон и начните говорить...'}
                </div>
                <button className="clear-btn" onClick={clearCanvas}>
                    Очистить
                </button>
            </div>
        </div>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
