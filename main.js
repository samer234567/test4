// ============================================
// 🎬 رابط الفيديو - عدّله هنا
// ============================================
const VIDEO_URL = 'https://pixeldrain.com/api/file/Ve2iAF6E';

// ============================================
// CONFIGURATION & DEVICE DETECTION
// ============================================
const CONFIG = {
    videoUrl: VIDEO_URL,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    maxPixelRatio: 1.5,
    sphereSegments: { mobile: 32, desktop: 64 },
    videoLoadTimeout: 30000
};

// ============================================
// DOM ELEMENTS
// ============================================
const DOM = {
    loading: document.getElementById('loading'),
    loadingProgress: document.getElementById('loading-progress'),
    video: document.getElementById('video'),
    canvasContainer: document.getElementById('canvas-container'),
    topBar: document.getElementById('top-bar'),
    modeBadge: document.getElementById('mode-badge'),
    controls: document.getElementById('controls'),
    progressWrapper: document.getElementById('progress-wrapper'),
    progressBar: document.getElementById('progress-bar'),
    currentTime: document.getElementById('current-time'),
    duration: document.getElementById('duration'),
    playBtn: document.getElementById('play-btn'),
    volumeBtn: document.getElementById('volume-btn'),
    backwardBtn: document.getElementById('backward-btn'),
    forwardBtn: document.getElementById('forward-btn'),
    vrBtn: document.getElementById('vr-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    closeSettings: document.getElementById('close-settings'),
    speedSlider: document.getElementById('speed-slider'),
    speedValue: document.getElementById('speed-value'),
    volumeSlider: document.getElementById('volume-slider'),
    volumeValue: document.getElementById('volume-value'),
    loopToggle: document.getElementById('loop-toggle'),
    ipdSlider: document.getElementById('ipd-slider'),
    ipdValue: document.getElementById('ipd-value'),
    separationSlider: document.getElementById('separation-slider'),
    separationValue: document.getElementById('separation-value'),
    sectionWidthSlider: document.getElementById('section-width-slider'),
    sectionWidthValue: document.getElementById('section-width-value'),
    fovSlider: document.getElementById('fov-slider'),
    fovValue: document.getElementById('fov-value'),
    rotationSlider: document.getElementById('rotation-slider'),
    rotationValue: document.getElementById('rotation-value'),
    zoomSlider: document.getElementById('zoom-slider'),
    zoomValue: document.getElementById('zoom-value'),
    brightnessSlider: document.getElementById('brightness-slider'),
    brightnessValue: document.getElementById('brightness-value'),
    vrOverlay: document.getElementById('vr-overlay'),
    vrPlay: document.getElementById('vr-play'),
    vrExit: document.getElementById('vr-exit'),
    gyroDialog: document.getElementById('gyro-dialog'),
    acceptGyro: document.getElementById('accept-gyro'),
    declineGyro: document.getElementById('decline-gyro'),
    notification: document.getElementById('notification')
};

// ============================================
// STATE
// ============================================
const State = {
    isPlaying: false,
    isMuted: false,
    isVRMode: false,
    volume: 0.7,
    playbackRate: 1.0,
    ipd: 64,
    separation: 2,
    sectionWidth: 50,
    fov: 75,
    rotation: 0,
    zoom: 1.0,
    brightness: 100,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    sphere: null,
    videoTexture: null,
    deviceOrientationControls: null,
    leftScene: null,
    leftCamera: null,
    leftRenderer: null,
    rightScene: null,
    rightCamera: null,
    rightRenderer: null,
    videoLoaded: false,
    loadingTimeout: null
};

// ============================================
// UTILITIES
// ============================================
const Utils = {
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    showNotification(message) {
        if (DOM.notification) {
            DOM.notification.textContent = message;
            DOM.notification.classList.add('show');
            setTimeout(() => DOM.notification.classList.remove('show'), 3000);
        }
    },

    updateLoadingProgress(message) {
        if (DOM.loadingProgress) {
            DOM.loadingProgress.textContent = message;
        }
    },

    requestFullscreen(element) {
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
        else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
        else if (element.msRequestFullscreen) element.msRequestFullscreen();
    },

    exitFullscreen() {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
};

// ============================================
// THREE.JS MANAGER
// ============================================
const ThreeJS = {
    init() {
        console.log('🎨 Initializing Three.js...');
        Utils.updateLoadingProgress('جاري تهيئة المشغل...');

        try {
            // Scene
            State.scene = new THREE.Scene();
            State.scene.background = new THREE.Color(0x000000);

            // Camera
            State.camera = new THREE.PerspectiveCamera(
                State.fov,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            State.camera.position.set(0, 0, 0.1);

            // Renderer
            State.renderer = new THREE.WebGLRenderer({
                antialias: !CONFIG.isMobile,
                alpha: false,
                powerPreference: 'high-performance'
            });

            State.renderer.setSize(window.innerWidth, window.innerHeight);
            State.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
            DOM.canvasContainer.appendChild(State.renderer.domElement);

            // Sphere
            const segments = CONFIG.isMobile ? CONFIG.sphereSegments.mobile : CONFIG.sphereSegments.desktop;
            const geometry = new THREE.SphereGeometry(500, segments, segments);
            geometry.scale(-1, 1, 1);

            // Video Texture
            State.videoTexture = new THREE.VideoTexture(DOM.video);
            State.videoTexture.minFilter = THREE.LinearFilter;
            State.videoTexture.magFilter = THREE.LinearFilter;
            State.videoTexture.format = THREE.RGBFormat;

            // Material
            const material = new THREE.MeshBasicMaterial({
                map: State.videoTexture
            });

            // Apply brightness
            const brightness = State.brightness / 100;
            material.color = new THREE.Color(brightness, brightness, brightness);

            // Mesh
            State.sphere = new THREE.Mesh(geometry, material);
            State.scene.add(State.sphere);

            // Controls
            State.controls = new THREE.OrbitControls(State.camera, State.renderer.domElement);
            State.controls.enableZoom = false;
            State.controls.enablePan = false;
            State.controls.rotateSpeed = -0.3;
            State.controls.enableDamping = true;
            State.controls.dampingFactor = 0.05;

            console.log('✅ Three.js initialized');
            this.animate();

        } catch (error) {
            console.error('❌ Three.js error:', error);
            Utils.showNotification('خطأ في تهيئة المشغل');
        }
    },

    animate() {
        requestAnimationFrame(() => this.animate());

        if (State.isVRMode) {
            this.renderVR();
        } else {
            this.renderNormal();
        }
    },

    renderNormal() {
        if (State.deviceOrientationControls) {
            State.deviceOrientationControls.update();
        }

        if (State.controls) {
            State.controls.update();
        }

        // Apply rotation
        if (State.sphere) {
            State.sphere.rotation.y = THREE.MathUtils.degToRad(State.rotation);
        }

        // Apply zoom
        if (State.camera) {
            State.camera.fov = State.fov / State.zoom;
            State.camera.updateProjectionMatrix();
        }

        if (State.renderer && State.scene && State.camera) {
            State.renderer.render(State.scene, State.camera);
        }
    },

    renderVR() {
        if (State.deviceOrientationControls) {
            State.deviceOrientationControls.update();

            if (State.leftCamera && State.rightCamera) {
                State.leftCamera.quaternion.copy(State.camera.quaternion);
                State.rightCamera.quaternion.copy(State.camera.quaternion);
            }
        }

        if (State.leftScene && State.leftScene.children[0]) {
            State.leftScene.children[0].rotation.y = THREE.MathUtils.degToRad(State.rotation);
        }
        if (State.rightScene && State.rightScene.children[0]) {
            State.rightScene.children[0].rotation.y = THREE.MathUtils.degToRad(State.rotation);
        }

        if (State.leftRenderer && State.leftScene && State.leftCamera) {
            State.leftRenderer.render(State.leftScene, State.leftCamera);
        }

        if (State.rightRenderer && State.rightScene && State.rightCamera) {
            State.rightRenderer.render(State.rightScene, State.rightCamera);
        }
    },

    resize() {
        if (!State.camera || !State.renderer) return;

        State.camera.aspect = window.innerWidth / window.innerHeight;
        State.camera.updateProjectionMatrix();
        State.renderer.setSize(window.innerWidth, window.innerHeight);

        if (State.isVRMode) {
            this.updateVRSettings();
        }
    },

    updateVRSettings() {
        if (!State.isVRMode) return;

        const leftWidth = (window.innerWidth * State.sectionWidth) / 100;
        const rightWidth = window.innerWidth - leftWidth - State.separation;

        if (State.leftRenderer) {
            State.leftRenderer.setSize(leftWidth, window.innerHeight);
            State.leftRenderer.domElement.style.width = leftWidth + 'px';
        }

        if (State.rightRenderer) {
            State.rightRenderer.setSize(rightWidth, window.innerHeight);
            State.rightRenderer.domElement.style.width = rightWidth + 'px';
            State.rightRenderer.domElement.style.left = (leftWidth + State.separation) + 'px';
        }

        const ipd = State.ipd / 1000;
        if (State.leftCamera) {
            State.leftCamera.position.set(-ipd / 2, 0, 0);
            State.leftCamera.fov = State.fov / State.zoom;
            State.leftCamera.aspect = leftWidth / window.innerHeight;
            State.leftCamera.updateProjectionMatrix();
        }

        if (State.rightCamera) {
            State.rightCamera.position.set(ipd / 2, 0, 0);
            State.rightCamera.fov = State.fov / State.zoom;
            State.rightCamera.aspect = rightWidth / window.innerHeight;
            State.rightCamera.updateProjectionMatrix();
        }
    }
};

// ============================================
// VIDEO MANAGER
// ============================================
const VideoManager = {
    init() {
        console.log('📹 Loading video:', CONFIG.videoUrl);
        Utils.updateLoadingProgress('جاري تحميل الفيديو...');

        State.loadingTimeout = setTimeout(() => {
            if (!State.videoLoaded) {
                console.error('❌ Video timeout');
                Utils.showNotification('انتهت مهلة تحميل الفيديو');
                if (DOM.loading) DOM.loading.classList.add('hide');
            }
        }, CONFIG.videoLoadTimeout);

        // Set video source - WITHOUT crossorigin
        DOM.video.src = CONFIG.videoUrl;
        DOM.video.volume = State.volume;
        DOM.video.playbackRate = State.playbackRate;
        if (DOM.loopToggle) DOM.video.loop = DOM.loopToggle.checked;

        if (DOM.volumeSlider) DOM.volumeSlider.value = State.volume * 100;
        if (DOM.volumeValue) DOM.volumeValue.textContent = Math.round(State.volume * 100) + '%';
        if (DOM.speedSlider) DOM.speedSlider.value = State.playbackRate;
        if (DOM.speedValue) DOM.speedValue.textContent = State.playbackRate.toFixed(1) + 'x';

        DOM.video.addEventListener('loadedmetadata', () => {
            console.log('✅ Video loaded');
            State.videoLoaded = true;
            clearTimeout(State.loadingTimeout);

            if (DOM.duration) DOM.duration.textContent = Utils.formatTime(DOM.video.duration);
            Utils.updateLoadingProgress('تم التحميل!');
        });

        DOM.video.addEventListener('canplay', () => {
            console.log('✅ Video ready');
            if (DOM.loading) DOM.loading.classList.add('hide');

            this.play().catch(() => {
                Utils.showNotification('اضغط تشغيل لبدء الفيديو');
            });
        });

        DOM.video.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        DOM.video.addEventListener('error', (e) => {
            clearTimeout(State.loadingTimeout);
            console.error('❌ Video error:', e);

            let msg = 'خطأ في تحميل الفيديو. ';
            if (DOM.video.error) {
                switch (DOM.video.error.code) {
                    case 1: msg += 'تم إلغاء التحميل.'; break;
                    case 2: msg += 'خطأ في الشبكة.'; break;
                    case 3: msg += 'خطأ في فك التشفير.'; break;
                    case 4: msg += 'الرابط غير صحيح.'; break;
                }
            }

            Utils.showNotification(msg);
            if (DOM.loading) DOM.loading.classList.add('hide');
        });

        // Force load
        DOM.video.load();
    },

    async play() {
        try {
            await DOM.video.play();
            State.isPlaying = true;
            if (DOM.playBtn) DOM.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            if (DOM.vrPlay) DOM.vrPlay.innerHTML = '<i class="fas fa-pause"></i>';

            if (DOM.video.muted) {
                DOM.video.muted = false;
            }
        } catch (error) {
            throw error;
        }
    },

    pause() {
        DOM.video.pause();
        State.isPlaying = false;
        if (DOM.playBtn) DOM.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (DOM.vrPlay) DOM.vrPlay.innerHTML = '<i class="fas fa-play"></i>';
    },

    togglePlay() {
        State.isPlaying ? this.pause() : this.play();
    },

    forward(seconds = 10) {
        DOM.video.currentTime = Math.min(DOM.video.currentTime + seconds, DOM.video.duration);
    },

    backward(seconds = 10) {
        DOM.video.currentTime = Math.max(DOM.video.currentTime - seconds, 0);
    },

    setVolume(volume) {
        DOM.video.volume = volume;
        State.volume = volume;
        if (DOM.volumeSlider) DOM.volumeSlider.value = volume * 100;
        if (DOM.volumeValue) DOM.volumeValue.textContent = Math.round(volume * 100) + '%';

        if (DOM.volumeBtn) {
            if (volume === 0) {
                DOM.volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                DOM.volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }
    },

    toggleMute() {
        if (State.isMuted) {
            this.setVolume(State.volume || 0.7);
            State.isMuted = false;
        } else {
            this.setVolume(0);
            State.isMuted = true;
        }
    },

    setSpeed(speed) {
        DOM.video.playbackRate = speed;
        State.playbackRate = speed;
        if (DOM.speedValue) DOM.speedValue.textContent = speed.toFixed(1) + 'x';
    },

    updateProgress() {
        if (DOM.video.duration > 0) {
            const percent = (DOM.video.currentTime / DOM.video.duration) * 100;
            if (DOM.progressBar) DOM.progressBar.style.width = percent + '%';
            if (DOM.currentTime) DOM.currentTime.textContent = Utils.formatTime(DOM.video.currentTime);
        }
    }
};

// ============================================
// VR MANAGER
// ============================================
const VRManager = {
    async enter() {
        console.log('🥽 Entering VR...');

        try {
            State.isVRMode = true;

            while (DOM.canvasContainer.firstChild) {
                DOM.canvasContainer.removeChild(DOM.canvasContainer.firstChild);
            }

            const ipd = State.ipd / 1000;
            const leftWidth = (window.innerWidth * State.sectionWidth) / 100;
            const rightWidth = window.innerWidth - leftWidth - State.separation;

            // Left Eye
            State.leftScene = new THREE.Scene();
            State.leftScene.background = new THREE.Color(0x000000);

            State.leftCamera = new THREE.PerspectiveCamera(
                State.fov / State.zoom,
                leftWidth / window.innerHeight,
                0.1,
                1000
            );
            State.leftCamera.position.set(-ipd / 2, 0, 0);

            State.leftRenderer = new THREE.WebGLRenderer({ antialias: false });
            State.leftRenderer.setSize(leftWidth, window.innerHeight);
            State.leftRenderer.domElement.style.cssText = `position:absolute;left:0;top:0;width:${leftWidth}px;height:100%`;
            DOM.canvasContainer.appendChild(State.leftRenderer.domElement);

            // Right Eye
            State.rightScene = new THREE.Scene();
            State.rightScene.background = new THREE.Color(0x000000);

            State.rightCamera = new THREE.PerspectiveCamera(
                State.fov / State.zoom,
                rightWidth / window.innerHeight,
                0.1,
                1000
            );
            State.rightCamera.position.set(ipd / 2, 0, 0);

            State.rightRenderer = new THREE.WebGLRenderer({ antialias: false });
            State.rightRenderer.setSize(rightWidth, window.innerHeight);
            State.rightRenderer.domElement.style.cssText = `position:absolute;left:${leftWidth + State.separation}px;top:0;width:${rightWidth}px;height:100%`;
            DOM.canvasContainer.appendChild(State.rightRenderer.domElement);

            // Spheres
            const geometry = new THREE.SphereGeometry(500, 48, 48);
            geometry.scale(-1, 1, 1);

            const material = new THREE.MeshBasicMaterial({ map: State.videoTexture });
            const brightness = State.brightness / 100;
            material.color = new THREE.Color(brightness, brightness, brightness);

            const leftSphere = new THREE.Mesh(geometry, material);
            const rightSphere = new THREE.Mesh(geometry, material.clone());

            State.leftScene.add(leftSphere);
            State.rightScene.add(rightSphere);

            await this.requestGyroscope();

            if (DOM.vrOverlay) DOM.vrOverlay.classList.add('show');
            if (DOM.controls) DOM.controls.classList.add('hidden');
            if (DOM.topBar) DOM.topBar.classList.add('hidden');

            if (DOM.modeBadge) {
                DOM.modeBadge.classList.add('vr-active');
                DOM.modeBadge.innerHTML = '<i class="fas fa-vr-cardboard"></i><span>وضع VR</span>';
            }

            if (DOM.vrBtn) DOM.vrBtn.innerHTML = '<i class="fas fa-eye"></i>';

            Utils.requestFullscreen(document.body);
            Utils.showNotification('تم تفعيل وضع VR');

        } catch (error) {
            console.error('❌ VR error:', error);
            Utils.showNotification('خطأ في وضع VR');
        }
    },

    exit() {
        console.log('🥽 Exiting VR...');

        State.isVRMode = false;

        if (State.leftRenderer) State.leftRenderer.dispose();
        if (State.rightRenderer) State.rightRenderer.dispose();

        while (DOM.canvasContainer.firstChild) {
            DOM.canvasContainer.removeChild(DOM.canvasContainer.firstChild);
        }

        ThreeJS.init();

        if (DOM.vrOverlay) DOM.vrOverlay.classList.remove('show');
        if (DOM.controls) DOM.controls.classList.remove('hidden');
        if (DOM.topBar) DOM.topBar.classList.remove('hidden');

        if (DOM.modeBadge) {
            DOM.modeBadge.classList.remove('vr-active');
            DOM.modeBadge.innerHTML = '<i class="fas fa-desktop"></i><span>عرض عادي</span>';
        }

        if (DOM.vrBtn) DOM.vrBtn.innerHTML = '<i class="fas fa-vr-cardboard"></i>';

        Utils.exitFullscreen();
        Utils.showNotification('تم إيقاف وضع VR');
    },

    async requestGyroscope() {
        if (typeof DeviceOrientationEvent !== 'undefined') {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                if (DOM.gyroDialog) DOM.gyroDialog.classList.add('show');

                const granted = await new Promise(resolve => {
                    if (DOM.acceptGyro) DOM.acceptGyro.onclick = () => resolve(true);
                    if (DOM.declineGyro) DOM.declineGyro.onclick = () => resolve(false);
                });

                if (DOM.gyroDialog) DOM.gyroDialog.classList.remove('show');

                if (granted) {
                    try {
                        const response = await DeviceOrientationEvent.requestPermission();
                        if (response === 'granted') {
                            this.enableGyroscope();
                            Utils.showNotification('تم تفعيل الجايروسكوب');
                        }
                    } catch (error) {
                        console.error('Gyroscope error:', error);
                    }
                }
            } else {
                this.enableGyroscope();
            }
        }
    },

    enableGyroscope() {
        try {
            if (State.camera && typeof THREE.DeviceOrientationControls !== 'undefined') {
                State.deviceOrientationControls = new THREE.DeviceOrientationControls(State.camera);
                if (State.controls) State.controls.enabled = false;
                console.log('✅ Gyroscope enabled');
            }
        } catch (error) {
            console.error('❌ Gyroscope error:', error);
        }
    }
};

// ============================================
// UI EVENTS
// ============================================
const UI = {
    init() {
        console.log('🎨 Init UI...');

        // Play/Pause
        if (DOM.playBtn) DOM.playBtn.addEventListener('click', () => VideoManager.togglePlay());
        if (DOM.vrPlay) DOM.vrPlay.addEventListener('click', () => VideoManager.togglePlay());

        // Volume
        if (DOM.volumeBtn) DOM.volumeBtn.addEventListener('click', () => VideoManager.toggleMute());
        if (DOM.volumeSlider) DOM.volumeSlider.addEventListener('input', (e) => VideoManager.setVolume(e.target.value / 100));

        // Speed
        if (DOM.speedSlider) DOM.speedSlider.addEventListener('input', (e) => VideoManager.setSpeed(parseFloat(e.target.value)));

        // Forward/Backward
        if (DOM.forwardBtn) DOM.forwardBtn.addEventListener('click', () => VideoManager.forward(10));
        if (DOM.backwardBtn) DOM.backwardBtn.addEventListener('click', () => VideoManager.backward(10));

        // Progress
        if (DOM.progressWrapper) {
            DOM.progressWrapper.addEventListener('click', (e) => {
                const rect = DOM.progressWrapper.getBoundingClientRect();
                const pos = e.clientX - rect.left;
                const percent = pos / rect.width;
                DOM.video.currentTime = percent * DOM.video.duration;
            });
        }

        // Settings
        if (DOM.settingsBtn) {
            DOM.settingsBtn.addEventListener('click', () => {
                if (DOM.settingsPanel) DOM.settingsPanel.classList.toggle('show');
            });
        }

        if (DOM.closeSettings) {
            DOM.closeSettings.addEventListener('click', () => {
                if (DOM.settingsPanel) DOM.settingsPanel.classList.remove('show');
            });
        }

        // VR
        if (DOM.vrBtn) {
            DOM.vrBtn.addEventListener('click', () => {
                State.isVRMode ? VRManager.exit() : VRManager.enter();
            });
        }

        if (DOM.vrExit) {
            DOM.vrExit.addEventListener('click', () => VRManager.exit());
        }

        // Fullscreen
        if (DOM.fullscreenBtn) {
            DOM.fullscreenBtn.addEventListener('click', () => {
                if (document.fullscreenElement) {
                    Utils.exitFullscreen();
                    DOM.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                } else {
                    Utils.requestFullscreen(document.body);
                    DOM.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                }
            });
        }

        // VR Settings
        this.setupVRSettings();

        // Window resize
        window.addEventListener('resize', () => ThreeJS.resize());
    },

    setupVRSettings() {
        // IPD
        if (DOM.ipdSlider) {
            DOM.ipdSlider.addEventListener('input', (e) => {
                State.ipd = parseFloat(e.target.value);
                if (DOM.ipdValue) DOM.ipdValue.textContent = State.ipd + 'mm';
                ThreeJS.updateVRSettings();
            });
        }

        // Separation
        if (DOM.separationSlider) {
            DOM.separationSlider.addEventListener('input', (e) => {
                State.separation = parseFloat(e.target.value);
                if (DOM.separationValue) DOM.separationValue.textContent = State.separation + 'px';
                ThreeJS.updateVRSettings();
            });
        }

        // Section Width
        if (DOM.sectionWidthSlider) {
            DOM.sectionWidthSlider.addEventListener('input', (e) => {
                State.sectionWidth = parseFloat(e.target.value);
                if (DOM.sectionWidthValue) DOM.sectionWidthValue.textContent = State.sectionWidth + '%';
                ThreeJS.updateVRSettings();
            });
        }

        // FOV
        if (DOM.fovSlider) {
            DOM.fovSlider.addEventListener('input', (e) => {
                State.fov = parseFloat(e.target.value);
                if (DOM.fovValue) DOM.fovValue.textContent = State.fov + '°';

                if (State.camera) {
                    State.camera.fov = State.fov;
                    State.camera.updateProjectionMatrix();
                }
                ThreeJS.updateVRSettings();
            });
        }

        // Rotation
        if (DOM.rotationSlider) {
            DOM.rotationSlider.addEventListener('input', (e) => {
                State.rotation = parseFloat(e.target.value);
                if (DOM.rotationValue) DOM.rotationValue.textContent = State.rotation + '°';
            });
        }

        // Zoom
        if (DOM.zoomSlider) {
            DOM.zoomSlider.addEventListener('input', (e) => {
                State.zoom = parseFloat(e.target.value);
                if (DOM.zoomValue) DOM.zoomValue.textContent = State.zoom.toFixed(1) + 'x';
                ThreeJS.updateVRSettings();
            });
        }

        // Brightness
        if (DOM.brightnessSlider) {
            DOM.brightnessSlider.addEventListener('input', (e) => {
                State.brightness = parseFloat(e.target.value);
                if (DOM.brightnessValue) DOM.brightnessValue.textContent = State.brightness + '%';

                if (State.sphere && State.sphere.material) {
                    const brightness = State.brightness / 100;
                    State.sphere.material.color = new THREE.Color(brightness, brightness, brightness);
                }
            });
        }
    }
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
    console.log('🚀 360 VR Player Starting...');
    console.log('📱 Device:', CONFIG.isMobile ? 'Mobile' : 'Desktop');
    console.log('🎬 Video:', CONFIG.videoUrl);

    try {
        ThreeJS.init();
        VideoManager.init();
        UI.init();

        console.log('✅ Player initialized');
    } catch (error) {
        console.error('❌ Init error:', error);
        if (DOM.loading) DOM.loading.classList.add('hide');
        Utils.showNotification('خطأ في تهيئة المشغل');
    }
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('📜 Script loaded');
