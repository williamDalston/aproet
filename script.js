// Global variables
let poemTimers = {};
let workoutTimer = null;
let workoutInterval = null;
let currentWorkoutExercise = 0;
let workoutPaused = false;
let completedPoems = 0;

// Poem types configuration
const poemTypes = ['sonnet', 'haiku', 'limerick', 'acrostic', 'freeverse'];

// Workout exercises
const exercises = [
    'Jumping Jacks',
    'Wall Sit', 
    'Push-ups',
    'Abdominal Crunches',
    'Step-ups',
    'Squats',
    'Tricep Dips',
    'Plank',
    'High Knees',
    'Lunges',
    'Push-up & Rotation',
    'Side Plank'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSavedPoems();
    updateProgress();
});

function initializeApp() {
    // Tab navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Initialize poem timers and event listeners
    poemTypes.forEach(type => {
        initializePoemType(type);
    });

    // Initialize workout controls
    initializeWorkout();
}

function initializePoemType(type) {
    const startBtn = document.querySelector(`[data-poem="${type}"]`);
    const saveBtn = document.querySelector(`[data-poem="${type}"]`).nextElementSibling;
    const textarea = document.getElementById(`${type}-text`);
    const timerElement = document.getElementById(`${type}-timer`);
    const poemCard = document.querySelector(`[data-type="${type}"]`);

    // Start timer button
    startBtn.addEventListener('click', () => {
        if (poemTimers[type]) {
            clearInterval(poemTimers[type]);
        }
        startPoemTimer(type, timerElement, poemCard);
    });

    // Save poem button
    saveBtn.addEventListener('click', () => {
        savePoem(type, textarea.value);
    });

    // Auto-save on text change
    textarea.addEventListener('input', () => {
        autoSavePoem(type, textarea.value);
    });

    // Load saved content
    loadPoemContent(type, textarea);
}

function startPoemTimer(type, timerElement, poemCard) {
    let timeLeft = 120; // 2 minutes in seconds
    poemCard.classList.add('timer-active');
    
    poemTimers[type] = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning styles
        if (timeLeft <= 30) {
            timerElement.classList.add('danger');
        } else if (timeLeft <= 60) {
            timerElement.classList.add('warning');
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(poemTimers[type]);
            timerElement.textContent = '0:00';
            timerElement.classList.remove('warning', 'danger');
            poemCard.classList.remove('timer-active');
            poemCard.classList.add('completed');
            
            // Mark as completed
            if (!poemCard.classList.contains('poem-completed')) {
                poemCard.classList.add('poem-completed');
                completedPoems++;
                updateProgress();
            }
            
            // Show completion notification
            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} time's up! Great work!`);
        }
    }, 1000);
}

function updateProgress() {
    const progressFill = document.getElementById('poetry-progress');
    const progressText = document.querySelector('.progress-text');
    const progress = (completedPoems / poemTypes.length) * 100;
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Complete ${completedPoems}/${poemTypes.length} poems`;
}

function savePoem(type, content) {
    if (!content.trim()) {
        showNotification('Please write something before saving!', 'warning');
        return;
    }

    const poem = {
        type: type,
        content: content,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };

    // Get existing poems
    const savedPoems = JSON.parse(localStorage.getItem('savedPoems') || '[]');
    
    // Add new poem
    savedPoems.push(poem);
    
    // Save to localStorage
    localStorage.setItem('savedPoems', JSON.stringify(savedPoems));
    
    // Update display
    loadSavedPoems();
    
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully!`);
}

function autoSavePoem(type, content) {
    localStorage.setItem(`draft_${type}`, content);
}

function loadPoemContent(type, textarea) {
    const draft = localStorage.getItem(`draft_${type}`);
    if (draft) {
        textarea.value = draft;
    }
}

function loadSavedPoems() {
    const savedPoems = JSON.parse(localStorage.getItem('savedPoems') || '[]');
    const container = document.getElementById('saved-poems-list');
    
    if (savedPoems.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; font-style: italic;">No saved poems yet. Start writing!</p>';
        return;
    }

    // Sort by date (newest first)
    savedPoems.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = savedPoems.map(poem => `
        <div class="saved-poem-item">
            <div class="saved-poem-header">
                <span class="saved-poem-type">${poem.type.charAt(0).toUpperCase() + poem.type.slice(1)}</span>
                <span class="saved-poem-date">${new Date(poem.date).toLocaleDateString()}</span>
            </div>
            <div class="saved-poem-content">${poem.content}</div>
        </div>
    `).join('');
}

function initializeWorkout() {
    const startBtn = document.getElementById('start-workout');
    const pauseBtn = document.getElementById('pause-workout');
    const resetBtn = document.getElementById('reset-workout');

    startBtn.addEventListener('click', startWorkout);
    pauseBtn.addEventListener('click', pauseWorkout);
    resetBtn.addEventListener('click', resetWorkout);
}

function startWorkout() {
    if (workoutPaused) {
        resumeWorkout();
        return;
    }

    const startBtn = document.getElementById('start-workout');
    const pauseBtn = document.getElementById('pause-workout');
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    currentWorkoutExercise = 0;
    let totalTime = 420; // 7 minutes in seconds
    
    // Update current exercise display
    updateCurrentExercise();
    
    workoutInterval = setInterval(() => {
        if (workoutPaused) return;
        
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        document.getElementById('workout-timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update exercise every 40 seconds (30s exercise + 10s rest)
        const exerciseTime = totalTime % 40;
        if (exerciseTime === 0 && totalTime < 420) {
            currentWorkoutExercise++;
            updateCurrentExercise();
        }
        
        totalTime--;
        
        if (totalTime < 0) {
            clearInterval(workoutInterval);
            completeWorkout();
        }
    }, 1000);
}

function pauseWorkout() {
    workoutPaused = !workoutPaused;
    const pauseBtn = document.getElementById('pause-workout');
    pauseBtn.textContent = workoutPaused ? 'Resume' : 'Pause';
}

function resumeWorkout() {
    workoutPaused = false;
    const pauseBtn = document.getElementById('pause-workout');
    pauseBtn.textContent = 'Pause';
}

function resetWorkout() {
    clearInterval(workoutInterval);
    workoutPaused = false;
    currentWorkoutExercise = 0;
    
    const startBtn = document.getElementById('start-workout');
    const pauseBtn = document.getElementById('pause-workout');
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    
    document.getElementById('workout-timer').textContent = '7:00';
    document.getElementById('current-exercise').textContent = 'Ready to start!';
    
    // Remove active class from all exercise cards
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.classList.remove('active');
    });
}

function updateCurrentExercise() {
    const exerciseName = exercises[currentWorkoutExercise] || 'Workout Complete!';
    document.getElementById('current-exercise').textContent = exerciseName;
    
    // Update active exercise card
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.classList.remove('active');
    });
    
    if (currentWorkoutExercise < exercises.length) {
        const activeCard = document.querySelector(`[data-exercise="${currentWorkoutExercise}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
    }
}

function completeWorkout() {
    const startBtn = document.getElementById('start-workout');
    const pauseBtn = document.getElementById('pause-workout');
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    
    document.getElementById('current-exercise').textContent = 'Workout Complete! 🎉';
    
    // Remove active class from all exercise cards
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.classList.remove('active');
    });
    
    showNotification('Amazing work! You completed the 7-minute workout!', 'success');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#48bb78' : type === 'warning' ? '#ed8936' : '#667eea',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        zIndex: '1000',
        fontSize: '1rem',
        fontWeight: '500',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add some additional utility functions
function clearAllDrafts() {
    poemTypes.forEach(type => {
        localStorage.removeItem(`draft_${type}`);
    });
    showNotification('All drafts cleared!');
}

function exportPoems() {
    const savedPoems = JSON.parse(localStorage.getItem('savedPoems') || '[]');
    if (savedPoems.length === 0) {
        showNotification('No poems to export!', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(savedPoems, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-poems-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Poems exported successfully!');
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save current poem
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const activeTextarea = document.activeElement;
        if (activeTextarea && activeTextarea.classList.contains('poem-textarea')) {
            const poemType = activeTextarea.id.replace('-text', '');
            savePoem(poemType, activeTextarea.value);
        }
    }
    
    // Space bar to start/pause workout when in workout tab
    if (e.code === 'Space' && document.getElementById('workout').classList.contains('active')) {
        e.preventDefault();
        const startBtn = document.getElementById('start-workout');
        const pauseBtn = document.getElementById('pause-workout');
        
        if (!startBtn.disabled) {
            startWorkout();
        } else if (!pauseBtn.disabled) {
            pauseWorkout();
        }
    }
});

// Add some visual feedback for completed poems
function markPoemCompleted(type) {
    const poemCard = document.querySelector(`[data-type="${type}"]`);
    if (!poemCard.classList.contains('poem-completed')) {
        poemCard.classList.add('poem-completed');
        completedPoems++;
        updateProgress();
    }
}

// Check for completed poems on load
function checkCompletedPoems() {
    poemTypes.forEach(type => {
        const textarea = document.getElementById(`${type}-text`);
        if (textarea.value.trim()) {
            markPoemCompleted(type);
        }
    });
}

// Initialize completed poems check
setTimeout(checkCompletedPoems, 1000);
