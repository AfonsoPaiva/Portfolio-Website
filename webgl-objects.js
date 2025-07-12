// WebGL Object Creation and Geometry
class WebGLObjects {
    constructor(gl) {
        this.gl = gl;
    }

    createCube() {
        // Define each face separately with 4 vertices each (24 total vertices)
        const vertices = [
            // Front face
            -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
            // Back face  
            -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
            // Top face
            -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
            // Bottom face
            -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
            // Right face
             0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
            // Left face
            -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5
        ];

        // Texture coordinates for texture atlas (6 faces in a 3x2 grid)
        // Each face uses 1/3 width and 1/2 height of the texture
        const texCoords = [
            // Front face (top-left: 0,0 to 1/3,1/2)
            0.0, 0.0,   1/3, 0.0,   1/3, 0.5,   0.0, 0.5,
            // Back face (top-middle: 1/3,0 to 2/3,1/2)
            1/3, 0.0,   2/3, 0.0,   2/3, 0.5,   1/3, 0.5,
            // Top face (top-right: 2/3,0 to 1,1/2)
            2/3, 0.0,   1.0, 0.0,   1.0, 0.5,   2/3, 0.5,
            // Bottom face (bottom-left: 0,1/2 to 1/3,1)
            0.0, 0.5,   1/3, 0.5,   1/3, 1.0,   0.0, 1.0,
            // Right face (bottom-middle: 1/3,1/2 to 2/3,1)
            1/3, 0.5,   2/3, 0.5,   2/3, 1.0,   1/3, 1.0,
            // Left face (bottom-right: 2/3,1/2 to 1,1)
            2/3, 0.5,   1.0, 0.5,   1.0, 1.0,   2/3, 1.0
        ];

        // Indices for each face (6 faces × 2 triangles × 3 vertices = 36 indices)
        const indices = [
            0,  1,  2,    0,  2,  3,    // Front face
            4,  5,  6,    4,  6,  7,    // Back face
            8,  9,  10,   8,  10, 11,   // Top face
            12, 13, 14,   12, 14, 15,   // Bottom face
            16, 17, 18,   16, 18, 19,   // Right face
            20, 21, 22,   20, 22, 23    // Left face
        ];

        return this.createBuffers(vertices, texCoords, indices);
    }

    createTable() {
        // Create a flatter parallelepiped for the table (wider, longer, but thinner)
        const width = 2.0;   // Table width
        const height = 2.0;  // Table thickness (much thinner)
        const depth = 2.0;   // Table depth
        
        const vertices = [
            // Front face
            -width/2, -height/2,  depth/2,   width/2, -height/2,  depth/2,   width/2,  height/2,  depth/2,  -width/2,  height/2,  depth/2,
            // Back face  
            -width/2, -height/2, -depth/2,  -width/2,  height/2, -depth/2,   width/2,  height/2, -depth/2,   width/2, -height/2, -depth/2,
            // Top face
            -width/2,  height/2, -depth/2,  -width/2,  height/2,  depth/2,   width/2,  height/2,  depth/2,   width/2,  height/2, -depth/2,
            // Bottom face
            -width/2, -height/2, -depth/2,   width/2, -height/2, -depth/2,   width/2, -height/2,  depth/2,  -width/2, -height/2,  depth/2,
            // Right face
             width/2, -height/2, -depth/2,   width/2,  height/2, -depth/2,   width/2,  height/2,  depth/2,   width/2, -height/2,  depth/2,
            // Left face
            -width/2, -height/2, -depth/2,  -width/2, -height/2,  depth/2,  -width/2,  height/2,  depth/2,  -width/2,  height/2, -depth/2
        ];

        // Texture coordinates for the table - we'll use the full texture for each face
        const texCoords = [
            // Front face 
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            // Back face
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            // Top face (most important for table)
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            // Bottom face
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            // Right face
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            // Left face
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0
        ];

        // Indices for each face (6 faces × 2 triangles × 3 vertices = 36 indices)
        const indices = [
            0,  1,  2,    0,  2,  3,    // Front face
            4,  5,  6,    4,  6,  7,    // Back face
            8,  9,  10,   8,  10, 11,   // Top face
            12, 13, 14,   12, 14, 15,   // Bottom face
            16, 17, 18,   16, 18, 19,   // Right face
            20, 21, 22,   20, 22, 23    // Left face
        ];

        return this.createBuffers(vertices, texCoords, indices);
    }

    createBuffers(vertices, texCoordsOrColors, indices) {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        // Handle both texture coordinates (for cubes, dice, and tables) 
        let texCoordBuffer = null;
        let colorBuffer = null;
        
        if (texCoordsOrColors) {
            texCoordBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoordsOrColors), this.gl.STATIC_DRAW);
        } 

        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

        return {
            positionBuffer,
            texCoordBuffer,
            colorBuffer,
            indexBuffer,
            indexCount: indices.length
        };
    }
}
