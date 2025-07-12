// WebGL Physics - Dice throwing physics simulation
class WebGLPhysics {
    constructor() {
        this.gravity = -0.8; // Gravity acceleration
        this.damping = 0.5; // Bounce damping factor
        this.airResistance = 0.99; // Air resistance factor
        this.tableHeight = -30; // Table surface height (where dice should land)
        this.diceSize = 15; // Half size of dice for collision detection
        
        // Physics state
        this.isActive = false;
        this.position = { x: 0, y: -15, z: 0 }; // Starting position on table
        this.velocity = { x: 0, y: 0, z: 0 };
        this.angularVelocity = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        
        // Animation state
        this.animationTime = 0;
        this.maxAnimationTime = 5.0; // Max time for physics simulation
    }

    // Start physics simulation with random initial velocity
    throwDice() {
        if (this.isActive) return; // Don't throw if already in motion
        
        this.isActive = true;
        this.animationTime = 0;
        
        // Random initial velocities for realistic throw
        this.velocity = {
            x: (Math.random() - 0.5) * 8, // Random horizontal velocity
            y: Math.random() * 15 + 10,   // Upward velocity
            z: (Math.random() - 0.5) * 8  // Random depth velocity
        };
        
        // Random angular velocities for tumbling effect (reduced for slower spin)
        this.angularVelocity = {
            x: (Math.random() - 0.5) * 2,  // Reduced from 20 to 8
            y: (Math.random() - 0.5) * 2,  // Reduced from 20 to 8
            z: (Math.random() - 0.5) * 2   // Reduced from 20 to 8
        };
        
        console.log('Dice thrown!', this.velocity);
    }
    
    // Update physics simulation
    update(deltaTime) {
        if (!this.isActive) return;
        
        this.animationTime += deltaTime;
        
        // Stop simulation after max time
        if (this.animationTime > this.maxAnimationTime) {
            this.stopPhysics();
            return;
        }
        
        // Apply gravity to Y velocity
        this.velocity.y += this.gravity * deltaTime * 60; // Scale for 60fps
        
        // Apply air resistance
        this.velocity.x *= this.airResistance;
        this.velocity.z *= this.airResistance;
        
        // Update position
        this.position.x += this.velocity.x * deltaTime * 60;
        this.position.y += this.velocity.y * deltaTime * 60;
        this.position.z += this.velocity.z * deltaTime * 60;
        
        // Update rotation
        this.rotation.x += this.angularVelocity.x * deltaTime * 60;
        this.rotation.y += this.angularVelocity.y * deltaTime * 60;
        this.rotation.z += this.angularVelocity.z * deltaTime * 60;
        
        // Check collision with table
        if (this.position.y <= this.tableHeight + this.diceSize) {
            this.handleTableCollision();
        }
        
        // Check if dice has settled completely and stop physics
        if (this.position.y <= this.tableHeight + this.diceSize + 1 && this.isCompletelyStill()) {
            this.stopPhysics();
            return;
        }
        
        // Keep dice within reasonable bounds
        this.constrainPosition();
    }
    
    // Check if dice is completely motionless
    isCompletelyStill() {
        const stillThreshold = 0.1;
        return Math.abs(this.velocity.x) < stillThreshold &&
               Math.abs(this.velocity.y) < stillThreshold &&
               Math.abs(this.velocity.z) < stillThreshold &&
               Math.abs(this.angularVelocity.x) < stillThreshold &&
               Math.abs(this.angularVelocity.y) < stillThreshold &&
               Math.abs(this.angularVelocity.z) < stillThreshold;
    }
    
    // Handle collision with table surface
    handleTableCollision() {
        // Snap to table surface
        this.position.y = this.tableHeight + this.diceSize;
        
        // Reverse and dampen Y velocity for bounce
        this.velocity.y = -this.velocity.y * this.damping;
        
        // Reduce angular velocities on impact
        this.angularVelocity.x *= this.damping;
        this.angularVelocity.y *= this.damping;
        this.angularVelocity.z *= this.damping;
        
        // Stop bouncing if velocity is too small (dice settles)
        if (Math.abs(this.velocity.y) < 2.0) {
            this.velocity.y = 0;
            this.velocity.x *= 0.6; // Strong friction when settling
            this.velocity.z *= 0.6; // Strong friction when settling
            
            // If dice is nearly stopped, align it to a face
            if (this.isNearlyStill()) {
                this.alignToNearestFace();
            }
        }
        
        // Stop spinning if angular velocity is too small
        if (Math.abs(this.angularVelocity.x) < 2.0) this.angularVelocity.x *= 0.8;
        if (Math.abs(this.angularVelocity.y) < 2.0) this.angularVelocity.y *= 0.8;
        if (Math.abs(this.angularVelocity.z) < 2.0) this.angularVelocity.z *= 0.8;
    }
    
    // Check if dice is nearly motionless
    isNearlyStill() {
        const velocityThreshold = 1.0;
        const angularThreshold = 1.0;
        
        return Math.abs(this.velocity.x) < velocityThreshold &&
               Math.abs(this.velocity.z) < velocityThreshold &&
               Math.abs(this.angularVelocity.x) < angularThreshold &&
               Math.abs(this.angularVelocity.y) < angularThreshold &&
               Math.abs(this.angularVelocity.z) < angularThreshold;
    }
    
    // Align dice to the nearest stable face orientation
    alignToNearestFace() {
        // Define the 6 possible stable orientations for a cube
        const stableFaces = [
            { x: 0, y: 0, z: 0 },                    // Face 1
            { x: Math.PI/2, y: 0, z: 0 },           // Face 2
            { x: -Math.PI/2, y: 0, z: 0 },          // Face 3
            { x: 0, y: 0, z: Math.PI/2 },           // Face 4
            { x: 0, y: 0, z: -Math.PI/2 },          // Face 5
            { x: Math.PI, y: 0, z: 0 }              // Face 6
        ];
        
        // Find the closest stable orientation
        let closestFace = stableFaces[0];
        let minDistance = Infinity;
        
        for (const face of stableFaces) {
            const distance = this.rotationDistance(this.rotation, face);
            if (distance < minDistance) {
                minDistance = distance;
                closestFace = face;
            }
        }
        
        // Smoothly transition to the closest face
        this.rotation.x = closestFace.x;
        this.rotation.y = closestFace.y;
        this.rotation.z = closestFace.z;
        
        // Stop all motion
        this.velocity = { x: 0, y: 0, z: 0 };
        this.angularVelocity = { x: 0, y: 0, z: 0 };
        
        console.log('Dice aligned to stable face:', closestFace);
    }
    
    // Calculate distance between two rotations
    rotationDistance(rot1, rot2) {
        const dx = Math.abs(rot1.x - rot2.x);
        const dy = Math.abs(rot1.y - rot2.y);
        const dz = Math.abs(rot1.z - rot2.z);
        return dx + dy + dz;
    }
    
    // Keep dice within reasonable bounds
    constrainPosition() {
        const maxDistance = 80; // Maximum distance from table center
        
        // Constrain X position
        if (Math.abs(this.position.x) > maxDistance) {
            this.position.x = Math.sign(this.position.x) * maxDistance;
            this.velocity.x = -this.velocity.x * this.damping;
        }
        
        // Constrain Z position
        if (Math.abs(this.position.z) > maxDistance) {
            this.position.z = Math.sign(this.position.z) * maxDistance;
            this.velocity.z = -this.velocity.z * this.damping;
        }
        
        // Don't let dice fall too far below table
        if (this.position.y < this.tableHeight - 100) {
            this.stopPhysics();
        }
    }
    
    // Stop physics simulation and settle dice with proper face orientation
    stopPhysics() {
        this.isActive = false;
        this.velocity = { x: 0, y: 0, z: 0 };
        this.angularVelocity = { x: 0, y: 0, z: 0 };
        
        // Snap dice to table surface
        this.position.y = this.tableHeight + this.diceSize;
        
        // Snap rotation to show a proper dice face (align to 90-degree increments)
        // This ensures one face is flat against the table
        this.rotation.x = this.snapToFace(this.rotation.x);
        this.rotation.y = this.snapToFace(this.rotation.y);
        this.rotation.z = this.snapToFace(this.rotation.z);
        
        console.log('Dice settled at:', this.position, 'Face rotation:', this.rotation);
    }
    
    // Snap rotation to nearest dice face (90-degree increments)
    snapToFace(angle) {
        const faceAngle = Math.PI / 2; // 90 degrees
        const normalizedAngle = angle % (2 * Math.PI);
        const faceIndex = Math.round(normalizedAngle / faceAngle);
        return faceIndex * faceAngle;
    }
    
    // Get current transformation matrix for rendering
    getTransformMatrix() {
        return {
            position: this.position,
            rotation: this.rotation,
            isActive: this.isActive
        };
    }
    
    // Reset dice to initial position
    reset() {
        this.isActive = false;
        this.position = { x: 0, y: -15, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.angularVelocity = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.animationTime = 0;
    }
}
