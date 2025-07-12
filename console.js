// Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger);
        if (typeof ScrollToPlugin !== 'undefined') {
            gsap.registerPlugin(ScrollToPlugin);
        }

        // Page Navigation
        function showPage(pageId) {
            const currentPage = document.querySelector('.page.active');
            const targetPage = document.getElementById(pageId);
            
            // Don't animate if same page or no current page
            if (!currentPage || currentPage === targetPage) {
                // Hide all pages
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                
                // Show selected page
                targetPage.classList.add('active');
                
                // Initialize page-specific functionality
                if (pageId === 'console') {
                    initConsoleMode();
                } else if (pageId === 'simple') {
                    initSimpleMode();
                }
                return;
            }
            
            // If leaving simple mode, scroll to top first, then navigate
            if (currentPage.id === 'simple' && pageId !== 'simple') {
                // Check if we're not already at the top
                if (window.scrollY > 0) {
                    // Smooth scroll to top first
                    if (typeof ScrollToPlugin !== 'undefined') {
                        // Use GSAP ScrollToPlugin if available
                        gsap.to(window, {
                            scrollTo: { y: 0 },
                            duration: 0.8,
                            ease: "power2.inOut",
                            onComplete: () => {
                                // After scrolling to top, proceed with page navigation
                                performPageTransition(currentPage, targetPage, pageId);
                            }
                        });
                    } else {
                        // Fallback to native smooth scrolling
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        // Wait for scroll to complete before navigating
                        setTimeout(() => {
                            performPageTransition(currentPage, targetPage, pageId);
                        }, 800);
                    }
                    return;
                }
            }
            
            // Proceed with normal page transition
            performPageTransition(currentPage, targetPage, pageId);
        }

        // Separated page transition logic
        function performPageTransition(currentPage, targetPage, pageId) {
            // Clear console before animation if going to console mode
            if (pageId === 'console') {
                const terminalBody = document.getElementById('terminal-body');
                if (terminalBody) {
                    terminalBody.innerHTML = '';
                }
            }
            
            // Determine animation direction based on current and target pages
            let animationDirection = 'right';
            
            if (currentPage.id === 'home') {
                // From home to console/simple
                if (pageId === 'simple') {
                    animationDirection = 'left';
                } else if (pageId === 'console') {
                    animationDirection = 'right';
                }
            } else if (currentPage.id === 'console') {
                // From console to home
                animationDirection = 'left';
            } else if (currentPage.id === 'simple') {
                // From simple to home
                animationDirection = 'right';
            }
            
            // Set up target page for animation
            targetPage.style.display = 'block';
            targetPage.style.opacity = '0';
            
            // Position target page off-screen based on direction
            if (animationDirection === 'left') {
                gsap.set(targetPage, { x: '100vw' });
            } else {
                gsap.set(targetPage, { x: '-100vw' });
            }
            
            // Create timeline for smooth transition
             const tl = gsap.timeline({
                onComplete: () => {
                    // Clean up after animation
                    currentPage.classList.remove('active');
                    currentPage.style.display = 'none';
                    gsap.set(currentPage, { clearProps: "all" }); // Clear all GSAP properties
                    
                    // Reset body scroll if leaving simple mode
                    if (currentPage.id === 'simple') {
                        document.body.style.overflow = '';
                        document.documentElement.style.overflow = '';
                        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
                    }
                    
                    // Clear WebGL windows if leaving console mode
                    if (currentPage.id === 'console' && typeof webglWindowManager !== 'undefined') {
                        webglWindowManager.clearAllWindows();
                    }
                    
                    targetPage.classList.add('active');
                    targetPage.style.opacity = '1';
                    gsap.set(targetPage, { clearProps: "all" }); // Clear all GSAP properties
                    
                    // Initialize page-specific functionality with delay for simple mode
                    if (pageId === 'console') {
                        initConsoleMode();
                    } else if (pageId === 'simple') {
                        // Add small delay to ensure DOM is ready
                        setTimeout(() => {
                            initSimpleMode();
                        }, 100);
                    } else if (pageId === 'home') {
                        // Reinitialize WebGL scene when returning to home
                        if (typeof reinitWebGL === 'function') {
                            reinitWebGL();
                        }
                    }
                }
            });
            
            // Animate current page out
            if (animationDirection === 'left') {
                tl.to(currentPage, {
                    x: '-100vw',
                    duration: 0.8,
                    ease: "power2.inOut"
                });
            } else {
                tl.to(currentPage, {
                    x: '100vw',
                    duration: 0.8,
                    ease: "power2.inOut"
                });
            }
            
            // Animate target page in (starts at the same time as current page out)
            tl.to(targetPage, {
                x: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.inOut"
            }, 0);
        }

        // Console Mode Functionality
        function initConsoleMode() {
            const terminalBody = document.getElementById('terminal-body');
            terminalBody.innerHTML = ''; // Clear previous content
            
            // Initialize WebGL window manager
            webglWindowManager.init();
            
            // Welcome message
            addTerminalLine('Welcome to Portfolio Terminal v1.0');
            addTerminalLine('Type "help" for available commands');
            addTerminalLine('');

            function addTerminalLine(text, isCommand = false) {
                const line = document.createElement('div');
                line.className = 'terminal-line';
                
                if (isCommand) {
                    line.innerHTML = `<span class="terminal-prompt">user@portfolio:~$</span> ${text}`;
                } else if (text !== '') {
                    line.innerHTML = `<span class="terminal-output">${text}</span>`;
                }
                
                terminalBody.appendChild(line);
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }

            // Make addTerminalLine globally accessible for dice callbacks
            window.addTerminalLine = addTerminalLine;

            function processCommand(command) {
                const parts = command.trim().split(' ');
                const cmd = parts[0].toLowerCase();
                const args = parts.slice(1);
                
                switch(cmd) {
                    case 'help':
                        addTerminalLine('Available commands:');
                        addTerminalLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        addTerminalLine('  about        - Display information about me');
                        addTerminalLine('  projects     - Show my projects');
                        addTerminalLine('  skills       - List my technical skills');
                        addTerminalLine('  contact      - Get my contact information');
                        addTerminalLine('  clear        - Clear the terminal');
                        addTerminalLine('  exit         - Return to home page');
                        addTerminalLine('');
                        addTerminalLine('3D Scene Commands:');
                        addTerminalLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        addTerminalLine('  spawn cube               - Spawn a cube window');
                        addTerminalLine('  dice                     - Show a dice table');
                        addTerminalLine('  clear windows            - Close all 3D windows');
                        addTerminalLine('  count windows            - Show window count');
                        break;
                    case 'spawn':
                        if (args[0] === 'cube') {
                            
                            const objectData = {
                                scale: 1.0, // Much larger scale for small window
                                color: [1.0, 0.0, 1.0] // Bright magenta for visibility
                            };
                            
                            webglWindowManager.createWindow('cube', objectData);
                            addTerminalLine(`Spawned cube window`);
                            
                        } else {
                            addTerminalLine('Usage: spawn cube');
                        }
                        break;
                    case 'dice':
                        const diceData = {
                            scale: 1.0,
                            color: [1.0, 1.0, 1.0] // White dice
                        };
                        
                        webglWindowManager.createWindow('dice', diceData);
                        addTerminalLine(`Created dice table window`);
                        addTerminalLine(`Controls: Drag to rotate camera, scroll to zoom`);
                        break;
                    case 'clear':
                        if (args[0] === 'windows') {
                            webglWindowManager.clearAllWindows();
                            addTerminalLine('All 3D windows closed!');
                        } else {
                            terminalBody.innerHTML = '';
                        }
                        break;
                    case 'count':
                        if (args[0] === 'windows') {
                            const count = webglWindowManager.getWindowCount();
                            addTerminalLine(`Current 3D windows: ${count}`);
                        } else {
                            addTerminalLine('Usage: count windows');
                        }
                        break;
                    case 'about':
                        addTerminalLine('Hi! I\'m a passionate web developer with expertise in');
                        addTerminalLine('modern web technologies. I love creating interactive');
                        addTerminalLine('and engaging user experiences.');
                        break;
                    case 'projects':
                        addTerminalLine('Recent Projects:');
                        addTerminalLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        addTerminalLine('  • E-commerce Platform - React & Node.js');
                        addTerminalLine('  • Portfolio Website - Vanilla JS & GSAP');
                        addTerminalLine('  • Weather App - Vue.js & OpenWeather API');
                        addTerminalLine('  • Task Manager - Angular & Firebase');
                        break;
                    case 'skills':
                        addTerminalLine('Technical Skills:');
                        addTerminalLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        addTerminalLine('  • Frontend: HTML5, CSS3, JavaScript (ES6+)');
                        addTerminalLine('  • Frameworks: React, Vue.js, Angular');
                        addTerminalLine('  • Backend: Node.js, Python, PHP');
                        addTerminalLine('  • Database: MongoDB, MySQL, PostgreSQL');
                        addTerminalLine('  • Tools: Git, Docker, AWS, Figma');
                        break;
                    case 'contact':
                        addTerminalLine('Contact Information:');
                        addTerminalLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        addTerminalLine('  • Email: hello@portfolio.dev');
                        addTerminalLine('  • LinkedIn: linkedin.com/in/portfolio');
                        addTerminalLine('  • GitHub: github.com/portfolio');
                        addTerminalLine('  • Website: portfolio.dev');
                        break;
                    case 'exit':
                        showPage('home');
                        return;
                    case '':
                        break;
                    default:
                        addTerminalLine(`Command not found: ${cmd}`);
                        addTerminalLine('Type "help" for available commands');
                }
            }

            // Create input line
            function createInputLine() {
                const inputLine = document.createElement('div');
                inputLine.className = 'terminal-line';
                inputLine.innerHTML = `
                    <span class="terminal-prompt">user@portfolio:~$</span>
                    <input type="text" class="terminal-input" autofocus>
                    <span class="cursor"></span>
                `;
                terminalBody.appendChild(inputLine);
                
                const input = inputLine.querySelector('.terminal-input');
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        const command = input.value;
                        inputLine.innerHTML = `<span class="terminal-prompt">user@portfolio:~$</span> ${command}`;
                        processCommand(command);
                        addTerminalLine('');
                        createInputLine();
                    }
                });
                
                input.focus();
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }

            createInputLine();

            // Focus on terminal click
            terminalBody.addEventListener('click', function() {
                const currentInput = document.querySelector('.terminal-input');
                if (currentInput) {
                    currentInput.focus();
                }
            });
        }

        // Simple Mode Functionality
        function initSimpleMode() {
            const container = document.getElementById('simple-container');
            const content = document.querySelector('#simple .simple-content');
            const sections = document.querySelectorAll('#simple .section');
            
            // Clear any existing ScrollTrigger instances
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            
            // Reset container and content positions
            gsap.set(container, { clearProps: "all" });
            gsap.set(content, { clearProps: "all" });
            gsap.set(sections, { clearProps: "all" });
            
            // Ensure proper setup
            gsap.set(container, {
                overflow: "hidden",
                height: "100vh"
            });
            
            // Set up the simple-content container for horizontal scroll
            gsap.set(content, {
                display: "flex",
                height: "100vh",
                width: `${sections.length}00vw`,
                willChange: "transform"
            });
            
            // Ensure sections maintain their flex centering
            gsap.set(sections, {
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
            });
            
            // Create the horizontal scroll timeline
            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    pin: true,
                    scrub: 1,
                    snap: {
                        snapTo: 1 / (sections.length - 1),
                        duration: 0.6,
                        delay: 0.1
                    },
                    end: () => "+=" + (sections.length - 1) * window.innerWidth,
                    invalidateOnRefresh: true,
                    anticipatePin: 1,
                    refreshPriority: -1
                }
            });

            // Animate the simple-content container horizontally
            tl.to(content, {
                x: () => -(sections.length - 1) * window.innerWidth,
                ease: "none"
            });

            // Animate section content with proper delays
            sections.forEach((section, index) => {
                const sectionContent = section.querySelector('.section-content');
                
                gsap.set(sectionContent, {
                    opacity: 0,
                    x: 50
                });

                gsap.to(sectionContent, {
                    opacity: 1,
                    x: 0,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "left 80%",
                        end: "left 20%",
                        scrub: 1,
                        containerAnimation: tl
                    }
                });
                
                // Add animated class for CSS animations
                ScrollTrigger.create({
                    trigger: section,
                    start: "left center",
                    end: "right center",
                    containerAnimation: tl,
                    onEnter: () => sectionContent.classList.add('animated'),
                    onLeave: () => sectionContent.classList.remove('animated'),
                    onEnterBack: () => sectionContent.classList.add('animated'),
                    onLeaveBack: () => sectionContent.classList.remove('animated')
                });
            });

            // Refresh ScrollTrigger to ensure proper setup
            ScrollTrigger.refresh();
        }

        // Contact form handler
        function handleSubmit(event) {
            event.preventDefault();
            alert('Thank you for your message! I\'ll get back to you soon.');
            event.target.reset();
        }
        
        // Project card expansion functionality
        let expandedCard = null;

        function expandProjectCard(card) {
            if (expandedCard) return; // Prevent multiple expansions
            
            expandedCard = card;
            const overlay = document.getElementById('projectOverlay');
            
            // Show overlay
            overlay.classList.add('active');
            
            // Block scrolling
            document.body.classList.add('project-expanded');
            
            // Get card's current position and size relative to the viewport
            const rect = card.getBoundingClientRect();
            const startX = rect.left;
            const startY = rect.top;
            const startWidth = rect.width;
            const startHeight = rect.height;
            
            // Calculate target position (center of the actual viewport)
            const isMobileView = window.matchMedia('(max-width: 768px)').matches;
            const isSmallMobile = window.matchMedia('(max-width: 480px)').matches;
            
            let targetWidth, targetHeight;
            if (isSmallMobile) {
                targetWidth = window.innerWidth * 0.98;
                targetHeight = window.innerHeight * 0.9;
            } else if (isMobileView) {
                targetWidth = window.innerWidth * 0.95;
                targetHeight = window.innerHeight * 0.85;
            } else {
                targetWidth = Math.min(window.innerWidth * 0.65, 1000);
                targetHeight = Math.min(window.innerHeight * 0.65, 700);
            }
            
            // Clone the card content to avoid issues with the horizontal scroll container
            const cardClone = card.cloneNode(true);
            cardClone.classList.add('project-card-clone');
            
            // Store reference to original card
            cardClone.setAttribute('data-original-card', 'true');
            card.setAttribute('data-is-original', 'true');
            
            // Hide the original card temporarily
            card.style.visibility = 'hidden';
            
            // Set initial position to current card position (absolute to viewport)
            gsap.set(cardClone, {
                position: 'fixed',
                left: startX,
                top: startY,
                width: startWidth,
                height: startHeight,
                zIndex: 10000,
                transform: 'none',
                margin: 0,
                padding: '1.5rem',
                boxSizing: 'border-box',
                // Clear any inherited animations or transforms
                animation: 'none',
                transition: 'none'
            });
            
            // Add the clone to the body (outside of any scroll containers)
            document.body.appendChild(cardClone);
            
            // Update the expandedCard reference to the clone
            expandedCard = cardClone;
            
            // Animate to expanded state (centered in actual viewport)
            gsap.to(cardClone, {
                left: (window.innerWidth - targetWidth) / 2,
                top: (window.innerHeight - targetHeight) / 2,
                width: targetWidth,
                height: targetHeight,
                duration: 0.6,
                ease: "power2.out",
                transform: 'none',
                onComplete: () => {
                    cardClone.classList.add('expanded');
                    // Ensure scrolling is available within the expanded card
                    cardClone.style.overflowY = 'auto';
                }
            });
            
            // Fade in overlay
            gsap.to(overlay, {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out"
            });
        }

        function closeProjectCard(event, card) {
            event.stopPropagation(); // Prevent card click event
            closeExpandedProject();
        }

        function closeExpandedProject() {
            if (!expandedCard) return;
            
            const cardClone = expandedCard;
            const overlay = document.getElementById('projectOverlay');
            
            // Find the original card using the data attribute
            const originalCard = document.querySelector('.project-card[data-is-original="true"]');
            
            // Remove expanded class first
            cardClone.classList.remove('expanded');
            
            // Get the original card's current position
            const originalRect = originalCard.getBoundingClientRect();
            const targetX = originalRect.left;
            const targetY = originalRect.top;
            const targetWidth = originalRect.width;
            const targetHeight = originalRect.height;
            
            // Animate back to original position
            gsap.to(cardClone, {
                left: targetX,
                top: targetY,
                width: targetWidth,
                height: targetHeight,
                duration: 0.5,
                ease: "power2.inOut",
                transform: 'none',
                onComplete: () => {
                    // Remove the clone
                    cardClone.remove();
                    
                    // Show the original card again and clean up attributes
                    if (originalCard) {
                        originalCard.style.visibility = 'visible';
                        originalCard.removeAttribute('data-is-original');
                    }
                    
                    // Re-enable scrolling
                    document.body.classList.remove('project-expanded');
                    expandedCard = null;
                }
            });
            
            // Fade out overlay
            gsap.to(overlay, {
                opacity: 0,
                duration: 0.4,
                ease: "power2.out",
                onComplete: () => {
                    overlay.classList.remove('active');
                }
            });
        }

        // Close expanded project when pressing ESC key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && expandedCard) {
                closeExpandedProject();
            }
        });

        // Mobile-specific optimizations
        function isMobileDevice() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.matchMedia('(max-width: 768px)').matches;
        }

        // Improved touch handling for mobile devices
        function addMobileOptimizations() {
            if (isMobileDevice()) {
                // Disable horizontal scroll on body when in simple mode
                document.body.addEventListener('touchmove', function(e) {
                    if (document.getElementById('simple').classList.contains('active') && !expandedCard) {
                        // Allow vertical scrolling only when project is not expanded
                        if (e.touches.length === 1) {
                            e.preventDefault();
                        }
                    }
                }, { passive: false });

                // Add touch feedback for interactive elements
                const interactiveElements = document.querySelectorAll('.nav-button, .project-card, .contact-button, .back-button');
                interactiveElements.forEach(element => {
                    element.addEventListener('touchstart', function() {
                        this.style.opacity = '0.8';
                    });
                    
                    element.addEventListener('touchend', function() {
                        setTimeout(() => {
                            this.style.opacity = '';
                        }, 150);
                    });
                });

                // Optimize scroll performance for simple mode
                if (typeof gsap !== 'undefined') {
                    gsap.config({ force3D: true });
                }
            }
        }

        // Enhanced project card expansion for mobile
        function isMobile() {
            return window.matchMedia('(max-width: 768px)').matches;
        }

        // Initialize mobile optimizations
        document.addEventListener('DOMContentLoaded', function() {
            showPage('home');
            addMobileOptimizations();
            
            // Add orientation change handler
            window.addEventListener('orientationchange', function() {
                setTimeout(() => {
                    if (expandedCard) {
                        // Recalculate position for expanded card on orientation change
                        const targetWidth = isMobile() ? 
                            (window.innerWidth < 480 ? window.innerWidth * 0.98 : window.innerWidth * 0.95) :
                            Math.min(window.innerWidth * 0.65, 1000);
                        const targetHeight = isMobile() ?
                            (window.innerWidth < 480 ? window.innerHeight * 0.9 : window.innerHeight * 0.85) :
                            Math.min(window.innerHeight * 0.65, 700);
                        
                        gsap.to(expandedCard, {
                            left: (window.innerWidth - targetWidth) / 2,
                            top: (window.innerHeight - targetHeight) / 2,
                            width: targetWidth,
                            height: targetHeight,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                    }
                }, 200);
            });
        });