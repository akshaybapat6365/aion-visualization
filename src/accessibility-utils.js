// Accessibility Utilities for Aion Visualization
// Provides screen reader support, keyboard navigation, and ARIA enhancements

class AccessibilityUtils {
    constructor() {
        this.announcer = this.createAnnouncer();
        this.focusTrap = null;
        this.skipLinks = this.createSkipLinks();
    }

    // Create screen reader announcer
    createAnnouncer() {
        const announcer = document.createElement('div');
        announcer.id = 'aria-announcer';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
        return announcer;
    }

    // Announce message to screen readers
    announce(message, priority = 'polite') {
        this.announcer.setAttribute('aria-live', priority);
        this.announcer.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            this.announcer.textContent = '';
        }, 1000);
    }

    // Create skip navigation links
    createSkipLinks() {
        const skipNav = document.createElement('div');
        skipNav.className = 'skip-links';
        skipNav.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#visualization" class="skip-link">Skip to visualization</a>
        `;
        document.body.insertBefore(skipNav, document.body.firstChild);
        return skipNav;
    }

    // Add ARIA labels to visualizations
    enhanceVisualization(container, description) {
        container.setAttribute('role', 'img');
        container.setAttribute('aria-label', description);
        
        // Add describedby for detailed description
        const descId = `desc-${Date.now()}`;
        const descElement = document.createElement('div');
        descElement.id = descId;
        descElement.className = 'sr-only';
        descElement.textContent = description;
        container.appendChild(descElement);
        container.setAttribute('aria-describedby', descId);
    }

    // Make visualization data accessible as table
    createAccessibleDataTable(data, container) {
        const table = document.createElement('table');
        table.className = 'sr-only accessible-data-table';
        table.setAttribute('role', 'table');
        table.setAttribute('aria-label', 'Visualization data in table format');
        
        // Create table content based on data structure
        const tableHTML = this.generateTableHTML(data);
        table.innerHTML = tableHTML;
        
        container.appendChild(table);
        return table;
    }

    // Generate table HTML from data
    generateTableHTML(data) {
        if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            let html = '<thead><tr>';
            
            headers.forEach(header => {
                html += `<th scope="col">${this.humanizeLabel(header)}</th>`;
            });
            
            html += '</tr></thead><tbody>';
            
            data.forEach(row => {
                html += '<tr>';
                headers.forEach(header => {
                    html += `<td>${row[header]}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody>';
            return html;
        }
        
        return '<tr><td>No data available</td></tr>';
    }

    // Convert camelCase to human readable
    humanizeLabel(str) {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    // Keyboard navigation handler
    enableKeyboardNavigation(container, elements, options = {}) {
        const navigableElements = Array.from(elements);
        let currentIndex = 0;

        container.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = (currentIndex + 1) % navigableElements.length;
                    navigableElements[currentIndex].focus();
                    break;
                    
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = (currentIndex - 1 + navigableElements.length) % navigableElements.length;
                    navigableElements[currentIndex].focus();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    currentIndex = 0;
                    navigableElements[currentIndex].focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    currentIndex = navigableElements.length - 1;
                    navigableElements[currentIndex].focus();
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (options.onActivate) {
                        options.onActivate(navigableElements[currentIndex]);
                    }
                    break;
            }
        });

        // Set up ARIA attributes
        navigableElements.forEach((el, index) => {
            el.setAttribute('tabindex', index === 0 ? '0' : '-1');
            el.setAttribute('role', options.role || 'button');
            
            el.addEventListener('focus', () => {
                currentIndex = index;
                navigableElements.forEach((otherEl, otherIndex) => {
                    otherEl.setAttribute('tabindex', otherIndex === index ? '0' : '-1');
                });
            });
        });
    }

    // Focus trap for modals
    createFocusTrap(container) {
        const focusableElements = container.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
            
            if (e.key === 'Escape') {
                this.releaseFocusTrap();
            }
        });

        this.focusTrap = { container, firstFocusable };
        firstFocusable.focus();
    }

    // Release focus trap
    releaseFocusTrap() {
        if (this.focusTrap) {
            this.focusTrap = null;
        }
    }

    // Add visualization summary for screen readers
    addVisualizationSummary(container, summaryData) {
        const summary = document.createElement('div');
        summary.className = 'visualization-summary sr-only';
        summary.setAttribute('role', 'region');
        summary.setAttribute('aria-label', 'Visualization summary');
        
        let summaryHTML = '<h3>Visualization Summary</h3>';
        
        if (summaryData.type) {
            summaryHTML += `<p>Type: ${summaryData.type}</p>`;
        }
        
        if (summaryData.dataPoints) {
            summaryHTML += `<p>Data points: ${summaryData.dataPoints}</p>`;
        }
        
        if (summaryData.trends) {
            summaryHTML += '<h4>Key Trends:</h4><ul>';
            summaryData.trends.forEach(trend => {
                summaryHTML += `<li>${trend}</li>`;
            });
            summaryHTML += '</ul>';
        }
        
        if (summaryData.insights) {
            summaryHTML += '<h4>Insights:</h4><ul>';
            summaryData.insights.forEach(insight => {
                summaryHTML += `<li>${insight}</li>`;
            });
            summaryHTML += '</ul>';
        }
        
        summary.innerHTML = summaryHTML;
        container.appendChild(summary);
    }

    // High contrast mode detector
    detectHighContrast() {
        const testElement = document.createElement('div');
        testElement.style.backgroundColor = 'rgb(255, 255, 255)';
        testElement.style.display = 'none';
        document.body.appendChild(testElement);
        
        const computedStyle = window.getComputedStyle(testElement);
        const isHighContrast = computedStyle.backgroundColor !== 'rgb(255, 255, 255)';
        
        document.body.removeChild(testElement);
        
        if (isHighContrast) {
            document.body.classList.add('high-contrast-mode');
        }
        
        return isHighContrast;
    }

    // Provide alternative text descriptions for complex visualizations
    describeVisualization(vizType, data) {
        const descriptions = {
            'mandala': `A circular mandala visualization with ${data.rings || 4} concentric rings representing ${data.concept || 'psychological wholeness'}. The center represents ${data.center || 'the Self'}.`,
            
            'timeline': `An interactive timeline spanning from ${data.startYear || 'start'} to ${data.endYear || 'end'}, showing ${data.eventCount || 'multiple'} significant events in ${data.subject || 'Jung\'s life'}.`,
            
            'network': `A network diagram showing ${data.nodeCount || 'multiple'} interconnected concepts. Central node represents ${data.centralConcept || 'the main concept'} with ${data.connectionCount || 'various'} connections.`,
            
            'flow': `A flow visualization depicting the movement from ${data.source || 'source'} to ${data.target || 'target'}, representing ${data.process || 'transformation'}.`,
            
            'duality': `A split visualization showing the contrast between ${data.light || 'light'} and ${data.dark || 'shadow'} aspects, illustrating ${data.concept || 'psychological duality'}.`
        };
        
        return descriptions[vizType] || `A ${vizType} visualization representing ${data.concept || 'Jungian concepts'}.`;
    }

    // Add keyboard shortcuts help
    addKeyboardHelp(container) {
        const helpButton = document.createElement('button');
        helpButton.className = 'keyboard-help-button';
        helpButton.setAttribute('aria-label', 'Keyboard shortcuts help');
        helpButton.innerHTML = '⌨️';
        
        const helpPanel = document.createElement('div');
        helpPanel.className = 'keyboard-help-panel hidden';
        helpPanel.setAttribute('role', 'dialog');
        helpPanel.setAttribute('aria-label', 'Keyboard shortcuts');
        helpPanel.innerHTML = `
            <h3>Keyboard Shortcuts</h3>
            <dl>
                <dt>Tab</dt>
                <dd>Navigate forward</dd>
                <dt>Shift + Tab</dt>
                <dd>Navigate backward</dd>
                <dt>Arrow Keys</dt>
                <dd>Navigate within visualizations</dd>
                <dt>Enter/Space</dt>
                <dd>Activate buttons and controls</dd>
                <dt>Escape</dt>
                <dd>Close dialogs</dd>
                <dt>?</dt>
                <dd>Show this help</dd>
            </dl>
            <button class="close-help">Close</button>
        `;
        
        helpButton.addEventListener('click', () => {
            helpPanel.classList.toggle('hidden');
            if (!helpPanel.classList.contains('hidden')) {
                this.createFocusTrap(helpPanel);
            }
        });
        
        helpPanel.querySelector('.close-help').addEventListener('click', () => {
            helpPanel.classList.add('hidden');
            this.releaseFocusTrap();
            helpButton.focus();
        });
        
        container.appendChild(helpButton);
        container.appendChild(helpPanel);
        
        // Global keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' && !e.target.matches('input, textarea')) {
                helpButton.click();
            }
        });
    }
}

// CSS for accessibility features
const accessibilityStyles = `
<style>
/* Screen reader only content */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

/* Skip links */
.skip-links {
    position: absolute;
    top: -40px;
    left: 0;
    z-index: 999;
}

.skip-link {
    display: block;
    padding: 8px;
    background: var(--accent);
    color: white;
    text-decoration: none;
    border-radius: 0 0 4px 0;
}

.skip-link:focus {
    position: absolute;
    top: 0;
    left: 0;
}

/* Focus indicators */
:focus {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
}

.focus-visible:focus {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
}

/* Keyboard help */
.keyboard-help-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--surface-glass);
    border: 2px solid var(--border-default);
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 100;
    transition: all 0.3s ease;
}

.keyboard-help-button:hover {
    background: var(--surface-glass-hover);
    transform: scale(1.1);
}

.keyboard-help-panel {
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: var(--surface-secondary);
    border: 2px solid var(--border-default);
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 300px;
    z-index: 101;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.keyboard-help-panel.hidden {
    display: none;
}

.keyboard-help-panel h3 {
    margin-top: 0;
    color: var(--text-primary);
}

.keyboard-help-panel dl {
    margin: 1rem 0;
}

.keyboard-help-panel dt {
    font-weight: bold;
    color: var(--accent);
    margin-top: 0.5rem;
}

.keyboard-help-panel dd {
    margin-left: 0;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.close-help {
    width: 100%;
    padding: 0.5rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

/* High contrast mode adjustments */
.high-contrast-mode {
    --accent: #FFD700;
    --text-primary: #FFFFFF;
    --text-secondary: #FFFF00;
    --surface-glass: rgba(255, 255, 255, 0.1);
}

.high-contrast-mode .visualization-container {
    border: 3px solid white;
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
    .keyboard-help-button:hover {
        transform: none;
    }
}

/* Better target sizes for touch */
@media (pointer: coarse) {
    button, a, .clickable {
        min-height: 44px;
        min-width: 44px;
    }
}
</style>
`;

// Inject styles
if (!document.getElementById('accessibility-utils-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'accessibility-utils-styles';
    styleElement.innerHTML = accessibilityStyles;
    document.head.appendChild(styleElement.firstElementChild);
}

// Export as global
window.AccessibilityUtils = AccessibilityUtils;