import * as THREE from 'three';
import { TWEEN } from '@tweenjs/tween.js';

export class CameraController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.isAnimating = false;
        this.currentTween = null;
        this.pathPoints = [];
        this.tourMode = false;
        
        this.init();
    }
    
    init() {
        // Initialize TWEEN in animation loop
        this.tweenGroup = new TWEEN.Group();
    }
    
    update() {
        this.tweenGroup.update();
    }
    
    moveTo(targetPosition, onComplete, duration = 3000) {
        if (this.isAnimating && this.currentTween) {
            this.currentTween.stop();
        }
        
        this.isAnimating = true;
        
        const startPosition = this.camera.position.clone();
        const startQuaternion = this.camera.quaternion.clone();
        
        // Calculate look direction
        const lookAtPosition = targetPosition.clone();
        lookAtPosition.y = this.camera.position.y; // Keep same height for look direction
        
        // Create temporary camera to get target quaternion
        const tempCamera = this.camera.clone();
        tempCamera.position.copy(targetPosition);
        tempCamera.lookAt(lookAtPosition);
        const targetQuaternion = tempCamera.quaternion.clone();
        
        // Smooth camera path using bezier curve
        const controlPoint1 = startPosition.clone().lerp(targetPosition, 0.25);
        controlPoint1.y += 50; // Arc the path upward
        
        const controlPoint2 = startPosition.clone().lerp(targetPosition, 0.75);
        controlPoint2.y += 30;
        
        const curve = new THREE.CubicBezierCurve3(
            startPosition,
            controlPoint1,
            controlPoint2,
            targetPosition
        );
        
        const tween = new TWEEN.Tween({ t: 0 }, this.tweenGroup)
            .to({ t: 1 }, duration)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate((obj) => {
                // Update position along curve
                const point = curve.getPointAt(obj.t);
                this.camera.position.copy(point);
                
                // Smooth quaternion interpolation
                THREE.Quaternion.slerp(startQuaternion, targetQuaternion, this.camera.quaternion, obj.t);
            })
            .onComplete(() => {
                this.isAnimating = false;
                if (onComplete) onComplete();
            })
            .start();
        
        this.currentTween = tween;
    }
    
    focusOn(targetPosition, distance = 50, duration = 2000) {
        // Calculate camera position for focusing
        const direction = new THREE.Vector3(0.5, 0.5, 1).normalize();
        const cameraPosition = targetPosition.clone().add(direction.multiplyScalar(distance));
        
        this.moveTo(cameraPosition, () => {
            // Look at target after moving
            this.camera.lookAt(targetPosition);
        }, duration);
    }
    
    createCinematicPath(waypoints) {
        this.pathPoints = waypoints;
        
        // Create smooth spline through waypoints
        const curve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.5);
        
        return curve;
    }
    
    followPath(path, duration = 20000, onComplete) {
        if (this.isAnimating && this.currentTween) {
            this.currentTween.stop();
        }
        
        this.isAnimating = true;
        
        const tween = new TWEEN.Tween({ t: 0 }, this.tweenGroup)
            .to({ t: 1 }, duration)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate((obj) => {
                const point = path.getPointAt(obj.t);
                this.camera.position.copy(point);
                
                // Look ahead on the path
                const lookAheadT = Math.min(obj.t + 0.05, 1);
                const lookAtPoint = path.getPointAt(lookAheadT);
                this.camera.lookAt(lookAtPoint);
            })
            .onComplete(() => {
                this.isAnimating = false;
                if (onComplete) onComplete();
            })
            .start();
        
        this.currentTween = tween;
    }
    
    startGuidedTour(realms, duration = 60000) {
        this.tourMode = true;
        
        // Create waypoints for tour
        const waypoints = [];
        
        // Start high above
        waypoints.push(new THREE.Vector3(0, 400, 200));
        
        // Spiral down through realms
        Object.values(realms).forEach((realm, index) => {
            const angle = index * Math.PI / 3;
            const radius = 150 - index * 20;
            
            waypoints.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                realm.position.y,
                Math.sin(angle) * radius
            ));
            
            // Add closer inspection point
            waypoints.push(new THREE.Vector3(
                Math.cos(angle + 0.5) * radius * 0.5,
                realm.position.y,
                Math.sin(angle + 0.5) * radius * 0.5
            ));
        });
        
        // End at material world level
        waypoints.push(new THREE.Vector3(0, -50, 100));
        
        const tourPath = this.createCinematicPath(waypoints);
        
        this.followPath(tourPath, duration, () => {
            this.tourMode = false;
        });
    }
    
    stopTour() {
        this.tourMode = false;
        if (this.currentTween) {
            this.currentTween.stop();
        }
        this.isAnimating = false;
    }
    
    shake(intensity = 1, duration = 500) {
        const startPosition = this.camera.position.clone();
        const startTime = Date.now();
        
        const shakeAnimation = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const shakeAmount = intensity * (1 - progress);
                this.camera.position.x = startPosition.x + (Math.random() - 0.5) * shakeAmount;
                this.camera.position.y = startPosition.y + (Math.random() - 0.5) * shakeAmount;
                this.camera.position.z = startPosition.z + (Math.random() - 0.5) * shakeAmount;
                
                requestAnimationFrame(shakeAnimation);
            } else {
                this.camera.position.copy(startPosition);
            }
        };
        
        shakeAnimation();
    }
    
    zoomTo(targetFOV, duration = 1000) {
        const startFOV = this.camera.fov;
        
        const tween = new TWEEN.Tween({ fov: startFOV }, this.tweenGroup)
            .to({ fov: targetFOV }, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((obj) => {
                this.camera.fov = obj.fov;
                this.camera.updateProjectionMatrix();
            })
            .start();
    }
    
    orbit(center, radius, speed = 0.001) {
        const time = Date.now() * speed;
        
        this.camera.position.x = center.x + Math.cos(time) * radius;
        this.camera.position.z = center.z + Math.sin(time) * radius;
        this.camera.lookAt(center);
    }
    
    getCurrentRealmInView(realms) {
        // Determine which realm is currently most prominent in view
        let closestRealm = null;
        let closestDistance = Infinity;
        
        Object.entries(realms).forEach(([name, realm]) => {
            const distance = this.camera.position.distanceTo(realm.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestRealm = name;
            }
        });
        
        return closestRealm;
    }
}