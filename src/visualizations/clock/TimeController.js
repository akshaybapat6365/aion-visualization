/**
 * TimeController.js - Time control system for the Aion Clock
 */

class TimeController {
    constructor(aionClock) {
        this.clock = aionClock;
        this.controls = null;
        this.isPlaying = false;
        this.speed = 1;
        this.speeds = [1, 10, 100, 1000];
        this.projectionMode = false;
        
        this.init();
    }
    
    init() {
        this.createControls();
        this.bindEvents();
    }
    
    createControls() {
        // Create control panel
        this.controls = document.createElement('div');
        this.controls.className = 'time-controls';
        this.controls.innerHTML = `
            <div class="control-group transport">
                <button id="play-pause" class="control-btn">
                    <span class="play-icon">▶</span>
                    <span class="pause-icon" style="display:none">⏸</span>
                </button>
                <button id="step-back" class="control-btn" title="Step back 100 years">◀◀</button>
                <button id="step-forward" class="control-btn" title="Step forward 100 years">▶▶</button>
            </div>
            
            <div class="control-group speed">
                <label>Speed:</label>
                <div class="speed-buttons">
                    ${this.speeds.map(s => 
                        `<button class="speed-btn ${s === 1 ? 'active' : ''}" data-speed="${s}">${s}x</button>`
                    ).join('')}
                </div>
            </div>
            
            <div class="control-group navigation">
                <label>Jump to:</label>
                <input type="number" id="year-input" placeholder="Year" value="${this.clock.options.currentYear}">
                <button id="go-to-year" class="control-btn">Go</button>
            </div>
            
            <div class="control-group presets">
                <label>Historical Events:</label>
                <select id="event-select">
                    <option value="">Select an event...</option>
                    ${this.clock.historicalEvents.map(e => 
                        `<option value="${e.year}">${e.year > 0 ? e.year + ' CE' : Math.abs(e.year) + ' BCE'} - ${e.event}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="control-group mode">
                <button id="projection-toggle" class="control-btn mode-btn">
                    ${this.projectionMode ? 'Historical Mode' : 'Projection Mode'}
                </button>
                <button id="reset-view" class="control-btn">Reset View</button>
            </div>
            
            <div class="info-panel">
                <div class="current-info">
                    <span class="info-label">Current Year:</span>
                    <span id="current-year-display">${this.clock.options.currentYear}</span>
                </div>
                <div class="age-info">
                    <span class="info-label">Zodiac Age:</span>
                    <span id="current-age-display"></span>
                </div>
                <div class="cycle-info">
                    <span class="info-label">Great Year Progress:</span>
                    <div class="progress-bar">
                        <div id="cycle-progress" class="progress-fill"></div>
                    </div>
                    <span id="cycle-percent">0%</span>
                </div>
            </div>
        `;
        
        this.clock.container.appendChild(this.controls);
        this.updateDisplay();
    }
    
    bindEvents() {
        // Play/Pause
        document.getElementById('play-pause').addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        // Step controls
        document.getElementById('step-back').addEventListener('click', () => {
            this.stepYear(-100);
        });
        
        document.getElementById('step-forward').addEventListener('click', () => {
            this.stepYear(100);
        });
        
        // Speed controls
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseInt(e.target.dataset.speed);
                this.setSpeed(speed);
            });
        });
        
        // Year navigation
        document.getElementById('go-to-year').addEventListener('click', () => {
            const yearInput = document.getElementById('year-input');
            const year = parseInt(yearInput.value);
            if (!isNaN(year)) {
                this.goToYear(year);
            }
        });
        
        document.getElementById('year-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('go-to-year').click();
            }
        });
        
        // Event selection
        document.getElementById('event-select').addEventListener('change', (e) => {
            const year = parseInt(e.target.value);
            if (!isNaN(year)) {
                this.goToYear(year);
                // Show event details
                const event = this.clock.historicalEvents.find(ev => ev.year === year);
                if (event) {
                    this.showEventDetails(event);
                }
            }
        });
        
        // Mode toggle
        document.getElementById('projection-toggle').addEventListener('click', () => {
            this.toggleProjectionMode();
        });
        
        // Reset view
        document.getElementById('reset-view').addEventListener('click', () => {
            this.resetView();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    this.stepYear(-10);
                    break;
                case 'ArrowRight':
                    this.stepYear(10);
                    break;
                case 'ArrowUp':
                    this.changeSpeed(1);
                    break;
                case 'ArrowDown':
                    this.changeSpeed(-1);
                    break;
                case 'r':
                    this.resetView();
                    break;
            }
        });
    }
    
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('play-pause');
        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');
        
        if (this.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline';
            this.play();
        } else {
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
            this.pause();
        }
    }
    
    play() {
        this.clock.play();
        this.animationFrame = requestAnimationFrame(() => this.updateDisplay());
    }
    
    pause() {
        this.clock.pause();
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    setSpeed(speed) {
        this.speed = speed;
        this.clock.setSpeed(speed);
        
        // Update UI
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.speed) === speed);
        });
    }
    
    changeSpeed(direction) {
        const currentIndex = this.speeds.indexOf(this.speed);
        const newIndex = Math.max(0, Math.min(this.speeds.length - 1, currentIndex + direction));
        this.setSpeed(this.speeds[newIndex]);
    }
    
    stepYear(years) {
        this.goToYear(this.clock.options.currentYear + years);
    }
    
    goToYear(year) {
        this.clock.animateToYear(year);
        document.getElementById('year-input').value = year;
        this.updateDisplay();
    }
    
    toggleProjectionMode() {
        this.projectionMode = !this.projectionMode;
        const btn = document.getElementById('projection-toggle');
        btn.textContent = this.projectionMode ? 'Historical Mode' : 'Projection Mode';
        
        if (this.projectionMode) {
            // Show future projections
            this.showProjections();
        } else {
            // Hide projections
            this.hideProjections();
        }
    }
    
    showProjections() {
        // Add visual indicators for future ages
        const futureAges = [
            { year: 2150, age: 'Aquarius', event: 'Dawn of the Water Bearer' },
            { year: 4310, age: 'Capricorn', event: 'Age of Structure' },
            { year: 6470, age: 'Sagittarius', event: 'Age of Expansion' }
        ];
        
        // Add projection markers
        const projectionGroup = this.clock.overlayLayer.append('g')
            .attr('class', 'projections');
            
        futureAges.forEach(age => {
            const angle = this.clock.yearToAngle(age.year);
            const radius = this.clock.options.outerRadius + 40;
            const x = radius * Math.cos((angle - 90) * Math.PI / 180);
            const y = radius * Math.sin((angle - 90) * Math.PI / 180);
            
            const marker = projectionGroup.append('g')
                .attr('transform', `translate(${x}, ${y})`)
                .attr('class', 'projection-marker');
                
            marker.append('circle')
                .attr('r', 5)
                .attr('fill', '#999')
                .attr('stroke', '#666')
                .attr('stroke-dasharray', '2,2');
                
            marker.append('text')
                .attr('x', 10)
                .attr('y', 0)
                .attr('text-anchor', 'start')
                .attr('font-size', '12px')
                .attr('fill', '#666')
                .text(`${age.year} - ${age.event}`);
        });
    }
    
    hideProjections() {
        this.clock.overlayLayer.selectAll('.projections').remove();
    }
    
    resetView() {
        // Reset to current date
        const currentYear = new Date().getFullYear();
        this.goToYear(currentYear);
        
        // Reset rotation
        this.clock.rotationAngle = 0;
        this.clock.updateRotation();
        
        // Reset zoom
        this.clock.svg.call(d3.zoom().transform, d3.zoomIdentity);
        
        // Pause if playing
        if (this.isPlaying) {
            this.togglePlayPause();
        }
    }
    
    showEventDetails(event) {
        // Create modal or detailed view for event
        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="event-modal-content">
                <h2>${event.year > 0 ? event.year + ' CE' : Math.abs(event.year) + ' BCE'}</h2>
                <h3>${event.event}</h3>
                <p>${event.significance}</p>
                <button class="close-modal">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    updateDisplay() {
        // Update year display
        document.getElementById('current-year-display').textContent = 
            this.clock.options.currentYear > 0 ? 
            this.clock.options.currentYear + ' CE' : 
            Math.abs(this.clock.options.currentYear) + ' BCE';
            
        // Update age display
        const currentAge = this.clock.getCurrentAge();
        document.getElementById('current-age-display').textContent = 
            `${currentAge.name} (${currentAge.yearsRemaining} years remaining)`;
            
        // Update cycle progress
        const cycleProgress = ((this.clock.options.currentYear + 2150) % this.clock.GREAT_YEAR_DURATION) / 
            this.clock.GREAT_YEAR_DURATION * 100;
        document.getElementById('cycle-progress').style.width = cycleProgress + '%';
        document.getElementById('cycle-percent').textContent = cycleProgress.toFixed(1) + '%';
        
        // Continue updating if playing
        if (this.isPlaying) {
            this.animationFrame = requestAnimationFrame(() => this.updateDisplay());
        }
    }
}