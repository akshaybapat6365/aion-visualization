// Gesture Controller for Multi-touch Support
// Provides pinch, pan, rotate, and swipe gestures for visualizations

class GestureController {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            enablePinch: true,
            enablePan: true,
            enableRotate: true,
            enableSwipe: true,
            enableDoubleTap: true,
            enableLongPress: true,
            minScale: 0.5,
            maxScale: 3,
            ...options
        };
        
        this.state = {
            scale: 1,
            rotation: 0,
            translation: { x: 0, y: 0 },
            isDragging: false,
            isPinching: false,
            isRotating: false
        };
        
        this.touches = new Map();
        this.callbacks = new Map();
        this.lastTap = 0;
        this.longPressTimer = null;
        
        this.init();
    }
    
    init() {
        // Touch events
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
        
        // Mouse events (for desktop testing)
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.element.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // Prevent default gestures
        this.element.addEventListener('gesturestart', e => e.preventDefault());
        this.element.addEventListener('gesturechange', e => e.preventDefault());
        
        // Add touch-action CSS
        this.element.style.touchAction = 'none';
        this.element.style.userSelect = 'none';
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        
        // Store touch points
        for (const touch of event.changedTouches) {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now()
            });
        }
        
        const touchCount = this.touches.size;
        
        if (touchCount === 1) {
            // Single touch - start drag or tap
            this.state.isDragging = true;
            
            // Check for double tap
            const now = Date.now();
            if (now - this.lastTap < 300) {
                this.handleDoubleTap(event.changedTouches[0]);
                this.lastTap = 0;
            } else {
                this.lastTap = now;
            }
            
            // Long press detection
            if (this.options.enableLongPress) {
                this.longPressTimer = setTimeout(() => {
                    const touch = this.touches.get(event.changedTouches[0].identifier);
                    if (touch && !this.state.isDragging) {
                        this.handleLongPress(touch);
                    }
                }, 500);
            }
            
        } else if (touchCount === 2) {
            // Two touches - prepare for pinch/rotate
            this.state.isPinching = true;
            this.state.isRotating = true;
            clearTimeout(this.longPressTimer);
            
            // Calculate initial distance and angle
            const touches = Array.from(this.touches.values());
            this.initialPinchDistance = this.getDistance(touches[0], touches[1]);
            this.initialRotation = this.getAngle(touches[0], touches[1]);
        }
        
        this.emit('gesturestart', { touches: this.touches, state: this.state });
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        
        // Update touch positions
        for (const touch of event.changedTouches) {
            const storedTouch = this.touches.get(touch.identifier);
            if (storedTouch) {
                storedTouch.x = touch.clientX;
                storedTouch.y = touch.clientY;
            }
        }
        
        const touchCount = this.touches.size;
        
        if (touchCount === 1 && this.state.isDragging && this.options.enablePan) {
            // Pan gesture
            const touch = this.touches.values().next().value;
            const deltaX = touch.x - touch.startX;
            const deltaY = touch.y - touch.startY;
            
            this.state.translation.x += deltaX;
            this.state.translation.y += deltaY;
            
            // Update start position for continuous panning
            touch.startX = touch.x;
            touch.startY = touch.y;
            
            this.emit('pan', {
                deltaX,
                deltaY,
                translation: this.state.translation
            });
            
        } else if (touchCount === 2) {
            const touches = Array.from(this.touches.values());
            
            // Pinch gesture
            if (this.state.isPinching && this.options.enablePinch) {
                const currentDistance = this.getDistance(touches[0], touches[1]);
                const scale = currentDistance / this.initialPinchDistance;
                
                // Apply scale limits
                const newScale = this.state.scale * scale;
                if (newScale >= this.options.minScale && newScale <= this.options.maxScale) {
                    this.state.scale = newScale;
                    this.initialPinchDistance = currentDistance;
                    
                    this.emit('pinch', {
                        scale: this.state.scale,
                        center: this.getCenter(touches[0], touches[1])
                    });
                }
            }
            
            // Rotate gesture
            if (this.state.isRotating && this.options.enableRotate) {
                const currentAngle = this.getAngle(touches[0], touches[1]);
                const deltaRotation = currentAngle - this.initialRotation;
                
                this.state.rotation += deltaRotation;
                this.initialRotation = currentAngle;
                
                this.emit('rotate', {
                    rotation: this.state.rotation,
                    deltaRotation,
                    center: this.getCenter(touches[0], touches[1])
                });
            }
        }
        
        this.emit('gesturemove', { touches: this.touches, state: this.state });
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        
        // Check for swipe
        for (const touch of event.changedTouches) {
            const storedTouch = this.touches.get(touch.identifier);
            if (storedTouch && this.options.enableSwipe) {
                const deltaX = storedTouch.x - storedTouch.startX;
                const deltaY = storedTouch.y - storedTouch.startY;
                const deltaTime = Date.now() - storedTouch.startTime;
                const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
                
                if (velocity > 0.5 && deltaTime < 300) {
                    const direction = this.getSwipeDirection(deltaX, deltaY);
                    this.emit('swipe', { direction, velocity, deltaX, deltaY });
                }
            }
            
            this.touches.delete(touch.identifier);
        }
        
        // Reset states
        if (this.touches.size === 0) {
            this.state.isDragging = false;
            this.state.isPinching = false;
            this.state.isRotating = false;
            clearTimeout(this.longPressTimer);
        } else if (this.touches.size === 1) {
            this.state.isPinching = false;
            this.state.isRotating = false;
        }
        
        this.emit('gestureend', { touches: this.touches, state: this.state });
    }
    
    handleTouchCancel(event) {
        this.handleTouchEnd(event);
    }
    
    // Mouse event handlers for desktop
    handleMouseDown(event) {
        if (event.button !== 0) return; // Only left button
        
        const fakeTouch = {
            identifier: 'mouse',
            clientX: event.clientX,
            clientY: event.clientY
        };
        
        event.changedTouches = [fakeTouch];
        this.handleTouchStart(event);
    }
    
    handleMouseMove(event) {
        if (!this.touches.has('mouse')) return;
        
        const fakeTouch = {
            identifier: 'mouse',
            clientX: event.clientX,
            clientY: event.clientY
        };
        
        event.changedTouches = [fakeTouch];
        this.handleTouchMove(event);
    }
    
    handleMouseUp(event) {
        if (!this.touches.has('mouse')) return;
        
        const fakeTouch = {
            identifier: 'mouse',
            clientX: event.clientX,
            clientY: event.clientY
        };
        
        event.changedTouches = [fakeTouch];
        this.handleTouchEnd(event);
    }
    
    handleWheel(event) {
        event.preventDefault();
        
        if (!this.options.enablePinch) return;
        
        // Simulate pinch with mouse wheel
        const scale = event.deltaY > 0 ? 0.95 : 1.05;
        const newScale = this.state.scale * scale;
        
        if (newScale >= this.options.minScale && newScale <= this.options.maxScale) {
            this.state.scale = newScale;
            
            this.emit('pinch', {
                scale: this.state.scale,
                center: { x: event.clientX, y: event.clientY }
            });
        }
    }
    
    handleDoubleTap(touch) {
        if (!this.options.enableDoubleTap) return;
        
        this.emit('doubletap', {
            x: touch.clientX,
            y: touch.clientY
        });
    }
    
    handleLongPress(touch) {
        this.emit('longpress', {
            x: touch.x,
            y: touch.y
        });
    }
    
    // Utility functions
    getDistance(touch1, touch2) {
        const dx = touch2.x - touch1.x;
        const dy = touch2.y - touch1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getAngle(touch1, touch2) {
        return Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x) * 180 / Math.PI;
    }
    
    getCenter(touch1, touch2) {
        return {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2
        };
    }
    
    getSwipeDirection(deltaX, deltaY) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX > absY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }
    
    // Event system
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }
    
    off(event, callback) {
        if (!this.callbacks.has(event)) return;
        
        const callbacks = this.callbacks.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    emit(event, data) {
        if (!this.callbacks.has(event)) return;
        
        this.callbacks.get(event).forEach(callback => {
            callback(data);
        });
    }
    
    // Public methods
    reset() {
        this.state = {
            scale: 1,
            rotation: 0,
            translation: { x: 0, y: 0 },
            isDragging: false,
            isPinching: false,
            isRotating: false
        };
        
        this.emit('reset', this.state);
    }
    
    setScale(scale) {
        if (scale >= this.options.minScale && scale <= this.options.maxScale) {
            this.state.scale = scale;
            this.emit('pinch', { scale: this.state.scale });
        }
    }
    
    setTranslation(x, y) {
        this.state.translation.x = x;
        this.state.translation.y = y;
        this.emit('pan', { translation: this.state.translation });
    }
    
    setRotation(rotation) {
        this.state.rotation = rotation;
        this.emit('rotate', { rotation: this.state.rotation });
    }
    
    getState() {
        return { ...this.state };
    }
    
    // Cleanup
    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
        this.element.removeEventListener('touchcancel', this.handleTouchCancel);
        this.element.removeEventListener('mousedown', this.handleMouseDown);
        this.element.removeEventListener('mousemove', this.handleMouseMove);
        this.element.removeEventListener('mouseup', this.handleMouseUp);
        this.element.removeEventListener('wheel', this.handleWheel);
        
        clearTimeout(this.longPressTimer);
        this.touches.clear();
        this.callbacks.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GestureController;
}