class WebGLWindowManager {
    constructor() {
        this.windows = new Map();
        this.windowCounter = 0;
        this.container = null;
    }

    init() {
        this.container = document.getElementById('webgl-windows-container');
        if (!this.container) {
            console.error('WebGL windows container not found');
            return false;
        }
        return true;
    }

    createWindow( objectType, objectData) {
        if (!this.container) {
            this.init();
        }

        const windowId = `webgl-window-${++this.windowCounter}`;
        const canvasId = `webgl-canvas-${this.windowCounter}`;

        // Generate random screen position for window placement
        // Use different window sizes based on object type
        const windowWidth = objectType === 'dice' ? 600 : 350;
        const windowHeight = objectType === 'dice' ? 400 : 350;
        
        const screenX = Math.random() * (window.innerWidth - windowWidth);
        const screenY = Math.random() * (window.innerHeight - windowHeight);

        // Create window element
        const windowElement = document.createElement('div');
        windowElement.className = 'webgl-window';
        windowElement.id = windowId;
        // Add object type as data attribute for CSS targeting
        windowElement.setAttribute('data-object-type', objectType);
        windowElement.style.left = `${screenX}px`;
        windowElement.style.top = `${screenY}px`;

        windowElement.innerHTML = `
            <div class="webgl-window-header">
                <div class="webgl-window-title">${objectType === 'dice' ? 'Dice' : objectType} - Window ${this.windowCounter}</div>
            </div>
            <canvas id="${canvasId}" class="webgl-window-canvas"></canvas>
            <span class="webgl-window-close" onclick="webglWindowManager.closeWindow('${windowId}')">&times;</span>
        `;

        this.container.appendChild(windowElement);

        // Create WebGL scene for this window using the new renderer
        const scene = new WebGLRenderer(canvasId, objectType, objectData);
        
        this.windows.set(windowId, {
            element: windowElement,
            scene: scene,
            objectType: objectType,
            data: objectData
        });

        // Make window draggable
        this.makeDraggable(windowElement);

        return windowId;
    }

    closeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.scene.destroy();
            window.element.remove();
            this.windows.delete(windowId);
        }
    }

    clearAllWindows() {
        for (const [windowId] of this.windows) {
            this.closeWindow(windowId);
        }
    }

    getWindowCount() {
        return this.windows.size;
    }

    makeDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const header = element.querySelector('.webgl-window-header');
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(element.style.left, 10);
            startTop = parseInt(element.style.top, 10);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // Get actual window dimensions for proper bounds checking
            const rect = element.getBoundingClientRect();
            const windowWidth = rect.width;
            const windowHeight = rect.height;
            
            const newLeft = Math.max(0, Math.min(window.innerWidth - windowWidth, startLeft + deltaX));
            const newTop = Math.max(0, Math.min(window.innerHeight - windowHeight, startTop + deltaY));
            
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }
}

// Global window manager instance
const webglWindowManager = new WebGLWindowManager();
