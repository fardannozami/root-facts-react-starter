import {
  getCameraConfig,
  getCameraConstraints,
  getCameraErrorMessage,
  logError
} from '../utils/common.js';

export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = getCameraConfig();
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

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');

      tempStream.getTracks().forEach((track) => track.stop());

      if (cameras.length === 0) {
        logError('Tidak ada kamera ditemukan', new Error('Tidak ada perangkat input video yang tersedia'));
        return [];
      }

      return cameras.map((camera, index) => ({
        deviceId: camera.deviceId,
        label: camera.label || `Kamera ${index + 1}`
      }));

    } catch (error) {
      logError('Gagal memuat kamera', error);
      throw new Error(`Akses kamera gagal: ${error.message}`);
    }
  }

  // TODO [Basic] Memulai kamera dengan perangkat yang dipilih dan menampilkan pada elemen video
  async startCamera(selectedCameraId) {
    try {
      this.stopCamera();

      const constraints = getCameraConstraints(selectedCameraId);

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      return true;

    } catch (error) {
      logError('Gagal memulai kamera', error);
      const errorMessage = getCameraErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  // TODO [Basic] Menghentikan siaran kamera dan membersihkan sumber daya
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;

      if (this.video) {
        this.video.srcObject = null;
      }
    }
  }

  // TODO [Skilled] Implementasikan metode untuk mengatur FPS kamera
  setFPS(fps) {
    const { fpsRange } = this.config;
    if (fps < fpsRange.min || fps > fpsRange.max) {
      logError('FPS tidak valid', new Error(`FPS harus antara ${fpsRange.min} dan ${fpsRange.max}`));
      return;
    }

    this.config.defaultFPS = fps;
  }

  // TODO [Basic] Periksa apakah kamera sedang aktif
  isActive() {
    return this.stream && this.stream.active;
  }

  // TODO [Basic] Periksa apakah elemen video siap untuk digunakan
  isReady() {
    return this.isActive() &&
      this.video &&
      this.video.readyState >= 2 &&
      !this.video.paused;
  }

  captureFrame() {
    if (!this.isReady() || !this.canvas) {
      return null;
    }

    const ctx = this.canvas.getContext('2d');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    ctx.drawImage(this.video, 0, 0);

    return this.canvas;
  }
}