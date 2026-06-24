export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = null;
  }

  setVideoElement(videoElement) {
    this.video = videoElement;
  }

  setCanvasElement(canvasElement) {
    this.canvas = canvasElement;
  }

  getConstraints(selectedCameraId) {
    const fps = this.config?.fps || 30;
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: fps }
      },
      audio: false
    };

    if (selectedCameraId === 'front') {
      constraints.video.facingMode = 'user';
    } else if (selectedCameraId === 'default' || !selectedCameraId) {
      constraints.video.facingMode = { ideal: 'environment' };
    } else {
      constraints.video.deviceId = { exact: selectedCameraId };
    }

    return constraints;
  }

  // TODO [Basic] Tambahkan konfigurasi kamera untuk mendapatkan daftar perangkat input video
  // TODO [Basic] Dapatkan constraints kamera berdasarkan konfigurasi dan kamera yang dipilih
  async loadCameras() {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.warn('Camera permission not granted yet during loadCameras:', e);
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      this.config = {
        ...this.config,
        devices: videoDevices,
        fps: this.config?.fps || 30
      };
      return videoDevices;
    } catch (error) {
      console.error('Error loading cameras:', error);
      return [];
    }
  }

  // TODO [Basic] Memulai kamera dengan perangkat yang dipilih dan menampilkan pada elemen video
  async startCamera(selectedCameraId) {
    this.stopCamera();

    // Resolve camera choice if not explicitly provided
    let cameraId = selectedCameraId;
    if (!cameraId && typeof document !== 'undefined') {
      const cameraSelect = document.getElementById('camera-select');
      if (cameraSelect) {
        cameraId = cameraSelect.value;
      }
    }

    const constraints = this.getConstraints(cameraId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;

      if (this.video) {
        this.video.srcObject = stream;
        await this.video.play();
      }
      return stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw error;
    }
  }

  // TODO [Basic] Menghentikan siaran kamera dan membersihkan sumber daya
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // TODO [Skilled] Implementasikan metode untuk mengatur FPS kamera
  setFPS(fps) {
    if (!this.config) {
      this.config = {};
    }
    this.config.fps = Number(fps);

    if (this.stream) {
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
        videoTrack.applyConstraints({
          frameRate: { ideal: Number(fps) }
        }).catch((err) => {
          console.error('Failed to apply FPS constraint dynamically:', err);
        });
      }
    }
  }

  // TODO [Basic] Periksa apakah kamera sedang aktif
  isActive() {
    return !!(this.stream && this.stream.getTracks().some((track) => track.readyState === 'live'));
  }

  // TODO [Basic] Periksa apakah elemen video siap untuk digunakan
  isReady() {
    return !!(this.video && this.video.readyState >= 2 && this.video.videoWidth > 0);
  }
}