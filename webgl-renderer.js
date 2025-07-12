// WebGL Renderer - Core rendering logic (CORRIGIDO)
class WebGLRenderer {
    constructor(canvasId, objectType, objectData) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        this.objectType = objectType;
        this.objectData = objectData;
        this.rotation = 0;
        this.animationId = null;
        this.object = null;
        this.tableObject = null;
        
        // Initialize object creator
        this.objectCreator = new WebGLObjects(this.gl);
        
        // Initialize physics system for dice
        if (objectType === 'dice') {
            this.physics = new WebGLPhysics();
            this.lastTime = 0;
        }
        
        // Mouse control variables - CORRIGIDO: Posicionamento inicial da câmera
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.cameraDistance = 0.1; // Distância inicial mais próxima e controlada
        this.cameraAngleX = 0;   // Rotação horizontal
        this.cameraAngleY = 0.3; // Rotação vertical (olhando ligeiramente para baixo)
        
        // REMOVIDO: Camera settings antigos que não eram usados

        if (!this.gl) {
            console.error('WebGL not supported for window', canvasId);
            return;
        }

        this.init();
        this.createObjects();
        this.setupMouseControls();
        this.animate();
    }

    init() {
        this.resizeCanvas();
        this.setupShaders();
        this.setupWebGLState();
        this.loadTextures();
    }

    setupShaders() {
        // Vertex shader source with both texture coordinates and colors
        const vertexShaderSource = `
            attribute vec3 a_position;
            attribute vec2 a_texCoord;
            attribute vec3 a_color;
            uniform mat4 u_matrix;
            varying vec2 v_texCoord;
            varying vec3 v_color;

            void main() {
                gl_Position = u_matrix * vec4(a_position, 1.0);
                v_texCoord = a_texCoord;
                v_color = a_color;
            }
        `;

        // Fragment shader source for both textures and colors
        const fragmentShaderSource = `
            precision mediump float;
            varying vec2 v_texCoord;
            varying vec3 v_color;
            uniform sampler2D u_texture;

            void main() {
                vec4 texColor = texture2D(u_texture, v_texCoord);
                // If texture is missing, fallback to brown
                if (texColor.a == 0.0) {
                    gl_FragColor = vec4(0.4, 0.2, 0.05, 1.0); // fallback brown
                } else {
                    gl_FragColor = texColor;
                }
            }
        `;

        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        if (!this.program) {
            console.error('Failed to create shader program');
            return;
        }

        this.gl.useProgram(this.program);

        // Get attribute and uniform locations
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
        this.colorLocation = this.gl.getAttribLocation(this.program, 'a_color');
        this.matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
        this.textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
    }

    setupWebGLState() {
        // Enable depth testing with better precision
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.clearDepth(1.0);
        
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        // Disable face culling to ensure table is always visible
        this.gl.disable(this.gl.CULL_FACE);
    }

    loadTextures() {
        // Load main texture
        this.loadTexture();
        
        // Load table texture for dice scenes
        if (this.objectType === 'dice') {
            this.loadTableTexture();
        }
    }

    loadTexture() {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // Put a single pixel in the texture so it can be used immediately
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([255, 100, 100, 255]));

        const image = new Image();
        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            
            // Set texture parameters
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        };
        
        // Use same texture for all object types
        image.src = 'images/Cube.png';
        this.texture = texture;
    }

    loadTableTexture() {
        const tableTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, tableTexture);

        // Put a brown pixel in the texture so it can be used immediately
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([139, 69, 19, 255])); // Brown color

        const tableImage = new Image();
        tableImage.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, tableTexture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, tableImage);
            
            // Set texture parameters
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            
            console.log('Table texture loaded successfully');
        };
        
        tableImage.onerror = () => {
            console.error('Failed to load table texture');
        };
        
        // Use table texture - make sure this file exists
        tableImage.src = 'images/Table.png';
        this.tableTexture = tableTexture;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    createObjects() {
        const config = {
            position: [0, 0, 0], 
            scale: this.objectData.scale || 1.0,
            color: this.objectData.color
        };

        if (this.objectType === 'cube') {
            // Keep cube at original position but moved back
            config.position = [0, 0, -10];
            this.object = this.objectCreator.createCube(config);
        } else if (this.objectType === 'dice') {
            // Create both table and dice for dice scenes
            this.tableObject = this.objectCreator.createTable();
            this.object = this.objectCreator.createCube(); // The dice cube
        }
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    setupMouseControls() {
        // Only add mouse controls for dice
        if (this.objectType !== 'dice') return;

        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('mouseleave', (e) => {
            this.isMouseDown = false;
            this.canvas.style.cursor = 'default';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isMouseDown) return;

            const deltaX = e.clientX - this.mouseX;
            const deltaY = e.clientY - this.mouseY;

            // Update camera angles based on mouse movement
            this.cameraAngleX += deltaX * 0.01; // Horizontal rotation
            this.cameraAngleY += deltaY * 0.01; // Vertical rotation

            // Clamp vertical angle to prevent flipping
            this.cameraAngleY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.cameraAngleY));

            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraDistance += e.deltaY * 0.01;
            this.cameraDistance = Math.max(1.0, Math.min(15.0, this.cameraDistance)); // Better range for perspective
        });

        // Set initial cursor
        this.canvas.style.cursor = 'grab';
        
        // Add space bar event listener for throwing dice
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.physics.throwDice();
            }
        });
    }

    render() {
        // Use a darker background color to make objects more visible
        this.gl.clearColor(0.05, 0.05, 0.05, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        try {
            if (this.objectType === 'dice') {
                this.renderDiceScene();
            } else {
                this.renderMainObject();
            }
        } catch (error) {
            console.error('Error rendering objects:', error);
        }
    }

    renderMainObject() {
        // Bind main object position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.object.positionBuffer);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        if (this.objectType === 'cube') {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.object.texCoordBuffer);
            this.gl.enableVertexAttribArray(this.texCoordLocation);
            this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

            // Bind main object texture
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.uniform1i(this.textureLocation, 0);
        } 

        let rotX, rotY, rotZ;
        const scale = 1.0;
    
        // Rotating objects (cubes, etc.)
        rotX = this.rotation * 0.7;
        rotY = this.rotation;
        rotZ = this.rotation * 0.3;
        
        // Calculate rotation matrices for each axis
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosZ = Math.cos(rotZ);
        const sinZ = Math.sin(rotZ);
        
        // Standard rotation matrix for objects
        const matrix = [
            (cosY * cosZ) * scale,
            (cosY * sinZ) * scale,
            (-sinY) * scale,
            0,
            
            (sinX * sinY * cosZ - cosX * sinZ) * scale,
            (sinX * sinY * sinZ + cosX * cosZ) * scale,
            (sinX * cosY) * scale,
            0,
            
            (cosX * sinY * cosZ + sinX * sinZ) * scale,
            (cosX * sinY * sinZ - sinX * cosZ) * scale,
            (cosX * cosY) * scale,
            0,
            
            0, 0, 0, 1
        ];

        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

        // Draw main object
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.object.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.object.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    renderDiceScene() {
        // Create perspective matrix similar to the working example
        const aspect = this.canvas.width / this.canvas.height;
        const fieldOfViewRadians = Math.PI / 3; // 60 degrees
        const zNear = 1;
        const zFar = 2000;
        
        // Create base perspective matrix
        let matrix = this.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        
        // Calculate camera position based on mouse controls
        const baseDistance = 150 + (this.cameraDistance * 50); // Closer to dice
        const cameraX = baseDistance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
        const cameraY = baseDistance * Math.sin(this.cameraAngleY) - 15; // Look at dice on table
        const cameraZ = baseDistance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);
        
        // Create look-at matrix to look at the dice position on table (0, -15, 0)
        const eye = [cameraX, cameraY, cameraZ];
        const target = [0, -15, 0]; // Dice position on table
        const up = [0, 1, 0];
        
        const lookAtMatrix = this.createLookAtMatrix(eye, target, up);
        matrix = this.multiply(matrix, lookAtMatrix);
        
        // First render the table
        this.renderTable(matrix);
        
        // Then render the dice above it
        this.renderDice(matrix);
    }

    renderTable(perspectiveMatrix) {
        if (!this.tableObject) return;

        // Bind table buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tableObject.positionBuffer);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tableObject.texCoordBuffer);
        this.gl.enableVertexAttribArray(this.texCoordLocation);
        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Bind table texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tableTexture || this.texture);
        this.gl.uniform1i(this.textureLocation, 0);

        // Create transformation matrix for table
        let matrix = perspectiveMatrix;
        matrix = this.translate(matrix, 0, -50, 0); // Position table below center
        matrix = this.scale(matrix, 200, 20, 100); // Scale table to be flat and wide

        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

        // Draw table
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.tableObject.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.tableObject.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    renderDice(perspectiveMatrix) {
        if (!this.object) return;

        // Bind dice buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.object.positionBuffer);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.object.texCoordBuffer);
        this.gl.enableVertexAttribArray(this.texCoordLocation);
        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Bind dice texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(this.textureLocation, 0);

        // Create transformation matrix for dice with physics
        let matrix = perspectiveMatrix;
        
        if (this.physics) {
            const transform = this.physics.getTransformMatrix();
            
            // Use physics position and rotation
            matrix = this.translate(matrix, transform.position.x, transform.position.y, transform.position.z);
            matrix = this.xRotate(matrix, transform.rotation.x);
            matrix = this.yRotate(matrix, transform.rotation.y);
            matrix = this.zRotate(matrix, transform.rotation.z);
        } else {
            // Fallback to static position if no physics
            matrix = this.translate(matrix, 0, -15, 0);
        }
        
        matrix = this.scale(matrix, 30, 30, 30); // Scale dice to appropriate size

        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

        // Draw dice
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.object.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.object.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    animate(currentTime = 0) {
        // Calculate delta time for physics
        const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000.0 : 0;
        this.lastTime = currentTime;
        
        // Increment rotation for all objects (only for non-dice or non-physics objects)
        this.rotation += 0.02;
        
        // Update physics if active
        if (this.physics) {
            this.physics.update(deltaTime);
        }
        
        this.render();
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Matrix math functions based on working WebGL example
    perspective(fieldOfViewInRadians, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        const rangeInv = 1.0 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    }

    multiply(a, b) {
        const a00 = a[0 * 4 + 0];
        const a01 = a[0 * 4 + 1];
        const a02 = a[0 * 4 + 2];
        const a03 = a[0 * 4 + 3];
        const a10 = a[1 * 4 + 0];
        const a11 = a[1 * 4 + 1];
        const a12 = a[1 * 4 + 2];
        const a13 = a[1 * 4 + 3];
        const a20 = a[2 * 4 + 0];
        const a21 = a[2 * 4 + 1];
        const a22 = a[2 * 4 + 2];
        const a23 = a[2 * 4 + 3];
        const a30 = a[3 * 4 + 0];
        const a31 = a[3 * 4 + 1];
        const a32 = a[3 * 4 + 2];
        const a33 = a[3 * 4 + 3];
        const b00 = b[0 * 4 + 0];
        const b01 = b[0 * 4 + 1];
        const b02 = b[0 * 4 + 2];
        const b03 = b[0 * 4 + 3];
        const b10 = b[1 * 4 + 0];
        const b11 = b[1 * 4 + 1];
        const b12 = b[1 * 4 + 2];
        const b13 = b[1 * 4 + 3];
        const b20 = b[2 * 4 + 0];
        const b21 = b[2 * 4 + 1];
        const b22 = b[2 * 4 + 2];
        const b23 = b[2 * 4 + 3];
        const b30 = b[3 * 4 + 0];
        const b31 = b[3 * 4 + 1];
        const b32 = b[3 * 4 + 2];
        const b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    }

    translation(tx, ty, tz) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1,
        ];
    }

    xRotation(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ];
    }

    yRotation(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ];
    }

    zRotation(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }

    scaling(sx, sy, sz) {
        return [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ];
    }

    translate(m, tx, ty, tz) {
        return this.multiply(m, this.translation(tx, ty, tz));
    }

    xRotate(m, angleInRadians) {
        return this.multiply(m, this.xRotation(angleInRadians));
    }

    yRotate(m, angleInRadians) {
        return this.multiply(m, this.yRotation(angleInRadians));
    }

    zRotate(m, angleInRadians) {
        return this.multiply(m, this.zRotation(angleInRadians));
    }

    scale(m, sx, sy, sz) {
        return this.multiply(m, this.scaling(sx, sy, sz));
    }

    createLookAtMatrix(eye, target, up) {
        const zAxis = this.normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
        const xAxis = this.normalize(this.cross(up, zAxis));
        const yAxis = this.cross(zAxis, xAxis);
        
        return [
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -this.dot(xAxis, eye), -this.dot(yAxis, eye), -this.dot(zAxis, eye), 1
        ];
    }

    normalize(vec) {
        const length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
        return [vec[0] / length, vec[1] / length, vec[2] / length];
    }

    cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    // ...existing code...
}