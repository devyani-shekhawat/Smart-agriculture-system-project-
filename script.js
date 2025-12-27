// Blynk Configuration
const BLYNK_AUTH_TOKEN = 'zJyWLMuWEs-17kEsSu4HZURmfGFNUIiC';
const BLYNK_SERVER = 'https://blynk.cloud';

// Virtual Pin Mapping
const PINS = {
    TEMPERATURE: 'V0',
    HUMIDITY: 'V1',
    SOIL: 'V2',
    LIGHT: 'V3'
};

// Data history for mini graphs
let soilHistory = [];
let lightHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    fetchData();
    setInterval(fetchData, 5000); // Update every 5 seconds
});

// Create animated particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    for(let i = 0; i < 60; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Fetch data from Blynk
async function fetchData() {
    const indicator = document.getElementById('updateIndicator');
    indicator.classList.add('active');
    
    try {
        // Fetch all sensor values
        const [temp, humid, soil, light] = await Promise.all([
            getBlynkValue(PINS.TEMPERATURE),
            getBlynkValue(PINS.HUMIDITY),
            getBlynkValue(PINS.SOIL),
            getBlynkValue(PINS.LIGHT)
        ]);
        
        // Update display
        updateDisplay(temp, humid, soil, light);
        
        // Update status
        document.getElementById('systemStatus').textContent = 'ONLINE';
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('systemStatus').textContent = 'ERROR';
    }
    
    setTimeout(() => indicator.classList.remove('active'), 1000);
}

// Get value from Blynk API
async function getBlynkValue(pin) {
    const url = `${BLYNK_SERVER}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${pin}`;
    const response = await fetch(url);
    const value = await response.text();
    return parseFloat(value);
}

// Update display with new data
function updateDisplay(temp, humid, soil, light) {
    // Temperature
    const tempElement = document.getElementById('temp');
    tempElement.textContent = temp.toFixed(1);
    tempElement.classList.add('updating');
    setTimeout(() => tempElement.classList.remove('updating'), 500);
    updateProgress('tempProgress', 'tempPercent', temp, 50);
    
    // Humidity
    const humidElement = document.getElementById('humid');
    humidElement.textContent = humid.toFixed(1);
    humidElement.classList.add('updating');
    setTimeout(() => humidElement.classList.remove('updating'), 500);
    updateProgress('humidProgress', 'humidPercent', humid, 100);
    
    // Soil Moisture
    const soilElement = document.getElementById('soil');
    soilElement.textContent = Math.round(soil);
    soilElement.classList.add('updating');
    setTimeout(() => soilElement.classList.remove('updating'), 500);
    
    const soilStatus = getSoilStatus(soil);
    document.getElementById('soilStatus').textContent = soilStatus;
    
    // Update soil graph
    soilHistory.push(soil);
    if(soilHistory.length > 20) soilHistory.shift();
    drawMiniGraph('soilGraph', soilHistory, '#00ff88');
    
    // Light Level
    const lightElement = document.getElementById('light');
    lightElement.textContent = Math.round(light);
    lightElement.classList.add('updating');
    setTimeout(() => lightElement.classList.remove('updating'), 500);
    
    const lightStatus = getLightStatus(light);
    document.getElementById('lightStatus').textContent = lightStatus;
    
    // Update light graph
    lightHistory.push(light);
    if(lightHistory.length > 20) lightHistory.shift();
    drawMiniGraph('lightGraph', lightHistory, '#ffaa00');
    
    // Update alert box
    updateAlert(soil);
}

// Update circular progress
function updateProgress(circleId, textId, value, max) {
    const circle = document.getElementById(circleId);
    const text = document.getElementById(textId);
    const circumference = 377;
    const percent = (value / max) * 100;
    const offset = circumference - (percent / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    text.textContent = Math.round(percent) + '%';
}

// Get soil moisture status
function getSoilStatus(value) {
    if(value > 2500) return 'DRY';
    else if(value > 1500) return 'MOIST';
    else return 'WET';
}

// Get light level status (FIXED - NOT inverted)
function getLightStatus(value) {
    if(value < 1000) return 'DARK';
    else if(value < 2500) return 'DIM';
    else return 'BRIGHT';
}

// Update alert message
function updateAlert(soilValue) {
    const alertBox = document.getElementById('alertBox');
    const alertText = document.getElementById('alertText');
    
    if(soilValue > 2500) {
        alertBox.className = 'alert-box alert-dry';
        alertText.textContent = 'IRRIGATION SYSTEM ACTIVATION REQUIRED';
    } else {
        alertBox.className = 'alert-box alert-ok';
        alertText.textContent = 'OPTIMAL MOISTURE LEVELS - SYSTEM STANDBY';
    }
}

// Draw mini graph
function drawMiniGraph(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if(data.length < 2) return;
    
    // Find min/max for scaling
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    
    const step = width / (data.length - 1);
    
    data.forEach((value, index) => {
        const x = index * step;
        const y = height - ((value - min) / range) * (height - 10) - 5;
        
        if(index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw fill
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.fill();
}
// ============================================
// AI CHAT FUNCTIONALITY
// ============================================

// Get current sensor data for AI context
function getSensorContext() {
    const tempElement = document.getElementById('temp');
    const humidElement = document.getElementById('humid');
    const soilElement = document.getElementById('soil');
    const lightElement = document.getElementById('light');
    
    const temp = tempElement ? parseFloat(tempElement.textContent) : 0;
    const humid = humidElement ? parseFloat(humidElement.textContent) : 0;
    const soil = soilElement ? parseInt(soilElement.textContent) : 0;
    const light = lightElement ? parseInt(lightElement.textContent) : 0;
    
    const soilStatus = getSoilStatus(soil);
    const lightStatus = getLightStatus(light);
    
    return {
        temperature: temp,
        humidity: humid,
        soilMoisture: soil,
        soilStatus: soilStatus,
        lightLevel: light,
        lightStatus: lightStatus
    };
}


        
        if (!response.ok) {
            throw new Error('Backend request failed');
        }
        
        const data = await response.json();
        return data.response;
        
    } catch (error) {
        console.error('Error calling backend:', error);
        return "Sorry, I'm having trouble connecting to the AI service. Please make sure the backend server is running.";
    }
}

// Add message to chat UI
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
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle send button click
async function handleSendMessage() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const sendBtnText = document.getElementById('sendBtnText');
    const sendBtnLoader = document.getElementById('sendBtnLoader');
    
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    input.value = '';
    
    // Disable button and show loader
    sendBtn.disabled = true;
    sendBtnText.style.display = 'none';
    sendBtnLoader.style.display = 'inline-block';
    
    // Get AI response
    const response = await sendToAI(message);
    
    // Add bot response
    addMessage(response, false);
    
    // Re-enable button
    sendBtn.disabled = false;
    sendBtnText.style.display = 'inline';
    sendBtnLoader.style.display = 'none';
    
    input.focus();
}

// Initialize chat functionality
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    
    sendBtn.addEventListener('click', handleSendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
});