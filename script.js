// Blynk Config
const BLYNK_AUTH_TOKEN = 'zJyWLMuWEs-17kEsSu4HZURmfGFNUIiC';
const BLYNK_SERVER = 'https://blynk.cloud';
const PINS = {
    TEMPERATURE: 'V0',
    HUMIDITY: 'V1',
    SOIL: 'V2',
    LIGHT: 'V3'
};

// Data history
let soilHistory = [];
let lightHistory = [];

// Particle Cursor Trail
const canvas = document.getElementById('cursorCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `rgba(167, 139, 250, ${Math.random()})`;
        this.life = 100;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 2;
        if (this.size > 0.1) this.size -= 0.05;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    for (let i = 0; i < 3; i++) {
        particles.push(new Particle(mouseX, mouseY));
    }
});

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    
    requestAnimationFrame(animateParticles);
}

animateParticles();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Add 3D tilt to cartoon diagram
document.addEventListener('DOMContentLoaded', () => {
    const cartoon = document.querySelector('.cartoon-diagram');
    
    if (cartoon) {
        cartoon.addEventListener('mousemove', (e) => {
            const rect = cartoon.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;
            
            cartoon.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
        });
        
        cartoon.addEventListener('mouseleave', () => {
            cartoon.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    }
    
    // Existing tilt cards code continues...
    const tiltCards = document.querySelectorAll('[data-tilt]');
    // ... rest of your existing code
});
// Scroll-triggered animations with Intersection Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all fade-in-up elements
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach(el => observer.observe(el));
});

// Parallax effect for background stars
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const bgAnimation = document.querySelector('.bg-animation');
    
    if (bgAnimation) {
        bgAnimation.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
    
    lastScrollY = scrollY;
}, { passive: true });

// Typing Animation
const demoQuestions = [
    "Does my plant need water?",
    "Is the temperature too high?",
    "When should I water next?",
    "Is there enough light?"
];

let currentQuestionIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;

function typeQuestion() {
    const typingDemo = document.getElementById('typingDemo');
    if (!typingDemo) return;
    
    const currentQuestion = demoQuestions[currentQuestionIndex];
    
    if (!isDeleting && currentCharIndex < currentQuestion.length) {
        typingDemo.textContent = currentQuestion.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        setTimeout(typeQuestion, 80);
    } else if (isDeleting && currentCharIndex > 0) {
        typingDemo.textContent = currentQuestion.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        setTimeout(typeQuestion, 40);
    } else if (!isDeleting && currentCharIndex === currentQuestion.length) {
        setTimeout(() => {
            isDeleting = true;
            typeQuestion();
        }, 2000);
    } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentQuestionIndex = (currentQuestionIndex + 1) % demoQuestions.length;
        setTimeout(typeQuestion, 500);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setInterval(fetchData, 5000);
    typeQuestion();
    
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });
    }
});

// Fetch Data
async function fetchData() {
    try {
        const [temp, humid, soil, light] = await Promise.all([
            getBlynkValue(PINS.TEMPERATURE),
            getBlynkValue(PINS.HUMIDITY),
            getBlynkValue(PINS.SOIL),
            getBlynkValue(PINS.LIGHT)
        ]);
        
        updateDisplay(temp, humid, soil, light);
        
        document.getElementById('systemStatus').textContent = 'ONLINE';
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('systemStatus').textContent = 'ERROR';
    }
}

async function getBlynkValue(pin) {
    const url = `${BLYNK_SERVER}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${pin}`;
    const response = await fetch(url);
    return parseFloat(await response.text());
}

function updateDisplay(temp, humid, soil, light) {
    document.getElementById('temp').textContent = temp.toFixed(1);
    document.getElementById('humid').textContent = humid.toFixed(1);
    document.getElementById('soil').textContent = Math.round(soil);
    document.getElementById('light').textContent = Math.round(light);
    
    const soilStatus = getSoilStatus(soil);
    const lightStatus = getLightStatus(light);
    
    const soilStatusEl = document.getElementById('soilStatus');
    soilStatusEl.textContent = soilStatus;
    soilStatusEl.style.background = soil > 2500 ? '#FF453A' : soil > 1500 ? '#FFD60A' : '#30D158';
    soilStatusEl.style.color = '#000000';
    
    const lightStatusEl = document.getElementById('lightStatus');
    lightStatusEl.textContent = lightStatus;
    lightStatusEl.style.background = light < 1000 ? '#FF453A' : light < 2500 ? '#FFD60A' : '#30D158';
    lightStatusEl.style.color = '#000000';
    
    soilHistory.push(soil);
    if (soilHistory.length > 20) soilHistory.shift();
    
    lightHistory.push(light);
    if (lightHistory.length > 20) lightHistory.shift();
    
    drawGraph('soilGraph', soilHistory, '#30D158');
    drawGraph('lightGraph', lightHistory, '#FFD60A');
}

function getSoilStatus(value) {
    return value > 2500 ? 'DRY' : value > 1500 ? 'MOIST' : 'WET';
}

function getLightStatus(value) {
    return value < 1000 ? 'DARK' : value < 2500 ? 'DIM' : 'BRIGHT';
}

function drawGraph(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = 500;
    
    ctx.clearRect(0, 0, width, height);
    
    if (data.length < 2) return;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    
    const step = width / (data.length - 1);
    
    data.forEach((value, index) => {
        const x = index * step;
        const y = height - ((value - min) / range) * (height - 60) - 30;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
}

// Modal Functions
function openDetail(type) {
    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    
    const content = {
        sensors: `
            <h2>Sensor Monitoring System</h2>
            <p>The system uses four specialized sensors to continuously monitor plant health:</p>
            <ul>
                <li><strong>DHT22 Temperature & Humidity Sensor:</strong> Tracks air temperature (°C) and relative humidity (%). Optimal range: 18-24°C, 40-60% humidity</li>
                <li><strong>Capacitive Soil Moisture Sensor:</strong> Measures soil wetness levels (0-4095 scale). Values >2500 indicate dry soil needing water</li>
                <li><strong>LDR Light Sensor:</strong> Detects ambient light levels. Basil plants need bright conditions (>2500 lux) for healthy growth</li>
                <li><strong>5V Relay Module:</strong> Controls water pump for automated irrigation (currently in development)</li>
            </ul>
            <p>All sensors connect to the ESP32 microcontroller via GPIO pins and send readings every 5 seconds to ensure real-time monitoring.</p>
        `,
        cloud: `
            <h2>Cloud Storage & Access</h2>
            <p>Data flows seamlessly from your plant to the cloud:</p>
            <ul>
                <li><strong>ESP32 WiFi Connection:</strong> Microcontroller connects to 2.4GHz WiFi network and establishes secure connection to Blynk cloud</li>
                <li><strong>Blynk IoT Platform:</strong> Industry-standard platform stores sensor readings in virtual pins (V0-V3) with 99.9% uptime</li>
                <li><strong>REST API Access:</strong> Dashboard fetches latest data via secure HTTPS requests every 5 seconds</li>
                <li><strong>Data Persistence:</strong> All readings are stored historically, enabling trend analysis and pattern detection</li>
                <li><strong>Global Access:</strong> Check your plant's health from anywhere in the world with internet connection</li>
            </ul>
            <p>The cloud architecture ensures your data is always accessible, secure, and synchronized across all devices.</p>
        `,
        ai: `
            <h2>AI-Powered Analysis</h2>
            <p>Artificial intelligence transforms raw sensor data into actionable insights:</p>
            <ul>
                <li><strong>Groq AI Integration:</strong> Uses Meta's Llama 3.3 70B model for natural language understanding and plant care recommendations</li>
                <li><strong>Context-Aware Responses:</strong> AI receives real-time sensor data with each query, providing advice specific to current conditions</li>
                <li><strong>Pattern Recognition:</strong> Machine learning algorithms detect anomalies in sensor readings that may indicate stress or disease</li>
                <li><strong>Predictive Analysis:</strong> System can forecast watering needs 24-48 hours in advance based on historical patterns</li>
                <li><strong>Natural Language Interface:</strong> Simply ask questions in plain English - no technical knowledge required</li>
            </ul>
            <p>The AI backend runs on Vercel's serverless infrastructure, ensuring fast responses and scalability.</p>
        `,
        action: `
            <h2>Simple Recommendations</h2>
            <p>Get clear, actionable advice tailored to your plant:</p>
            <ul>
                <li><strong>Watering Guidance:</strong> AI tells you exactly when to water based on soil moisture, temperature, and humidity</li>
                <li><strong>Light Optimization:</strong> Receive suggestions on moving your plant or adjusting grow lights</li>
                <li><strong>Temperature Alerts:</strong> Get notified if conditions are too hot or cold for optimal growth</li>
                <li><strong>Humidity Management:</strong> Learn when to mist your plant or use a humidifier</li>
                <li><strong>Health Scoring:</strong> Understand overall plant health with easy-to-read metrics</li>
            </ul>
            <p>All recommendations are based on proven botanical research and real-time sensor data, ensuring your plant gets exactly what it needs.</p>
        `,
        disease: `
            <h2>Future: AI Disease Detection</h2>
            <p>The next evolution of this project will detect plant diseases before visible symptoms appear:</p>
            <ul>
                <li><strong>Micro-Pattern Analysis:</strong> Monitor subtle changes in soil moisture drying rates that indicate root problems or disease</li>
                <li><strong>Computer Vision Integration:</strong> Add camera module to capture leaf images and detect discoloration, spots, or wilting</li>
                <li><strong>Early Warning System:</strong> Predict disease 48-72 hours before symptoms are visible to human eye</li>
                <li><strong>Disease Classification:</strong> Identify specific diseases (fungal, bacterial, pest-related) for targeted treatment</li>
                <li><strong>Prevention Strategies:</strong> AI recommends environmental adjustments to prevent disease before it starts</li>
                <li><strong>Research Applications:</strong> Collect data for agricultural research on disease patterns and prevention</li>
            </ul>
            <p>This research direction could save billions in crop losses globally and is being developed for ISEF 2027 competition.</p>
        `,
        automation: `
            <h2>Future: Automated Plant Dome</h2>
            <p>Vision for a fully autonomous plant care system that requires zero human intervention:</p>
            <ul>
                <li><strong>Controlled Environment:</strong> Sealed dome with AI-managed temperature, humidity, light, and watering</li>
                <li><strong>Webcam Monitoring:</strong> Real-time visual analysis of plant health, detecting wilting, yellowing, or growth issues</li>
                <li><strong>Automated Irrigation:</strong> Water pump activates based on AI decisions from sensor data and visual analysis</li>
                <li><strong>Smart Lighting:</strong> LED grow lights adjust spectrum and duration based on plant growth stage and needs</li>
                <li><strong>Climate Control:</strong> Humidifier/dehumidifier and heating/cooling maintain optimal conditions automatically</li>
                <li><strong>Nutrient Delivery:</strong> Automated system adds fertilizer and nutrients based on plant requirements</li>
                <li><strong>Complete Autonomy:</strong> Plant thrives for months without human care - perfect for long trips or research</li>
            </ul>
            <p>This system would demonstrate how AI can completely automate agriculture, potentially revolutionizing farming in harsh climates or even space exploration.</p>
        `
    };
    
    modalBody.innerHTML = content[type];
    modal.style.display = 'block';
}

function closeDetail() {
    document.getElementById('detailModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// AI Chat
function getSensorContext() {
    return {
        temperature: parseFloat(document.getElementById('temp').textContent) || 0,
        humidity: parseFloat(document.getElementById('humid').textContent) || 0,
        soilMoisture: parseInt(document.getElementById('soil').textContent) || 0,
        soilStatus: document.getElementById('soilStatus').textContent,
        lightLevel: parseInt(document.getElementById('light').textContent) || 0,
        lightStatus: document.getElementById('lightStatus').textContent
    };
}

async function sendToAI(userMessage) {
    const sensorData = getSensorContext();
    
    try {
        const response = await fetch('https://smart-agriculture-system-project.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMessage,
                sensorData: sensorData
            })
        });
        
        if (!response.ok) throw new Error('Backend failed');
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error:', error);
        return "Sorry, I'm having trouble connecting. Please try again.";
    }
}

function addMessage(content, isUser = false) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🌱';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSendMessage() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const sendBtnText = document.getElementById('sendBtnText');
    const sendBtnLoader = document.getElementById('sendBtnLoader');
    
    const message = input.value.trim();
    if (!message) return;
    
    addMessage(message, true);
    input.value = '';
    
    sendBtn.disabled = true;
    sendBtnText.style.display = 'none';
    sendBtnLoader.style.display = 'inline-block';
    
    const response = await sendToAI(message);
    addMessage(response, false);
    
    sendBtn.disabled = false;
    sendBtnText.style.display = 'inline';
    sendBtnLoader.style.display = 'none';
    
    input.focus();
}

