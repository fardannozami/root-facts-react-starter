import { CAMERA_CONFIG, TENSORFLOW_CONFIG } from './config.js';

export const logError = (context, error) => {
  console.error(`❌ ${context}:`, error);
};

export const isWebGPUSupported = () => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

export const isMobileDevice = () => {
  return navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const createDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const validateModelMetadata = (metadata) => {
  return metadata && metadata.labels && Array.isArray(metadata.labels);
};

export const getCameraErrorMessage = (error) => {
  const errorMessages = {
    'NotAllowedError': 'Izin kamera ditolak. Harap izinkan akses kamera.',
    'NotFoundError': 'Tidak ada kamera ditemukan pada perangkat ini.',
    'NotReadableError': 'Kamera sedang digunakan oleh aplikasi lain.'
  };

  return errorMessages[error.name] || 'Gagal memulai kamera';
};

export const updatePerformanceStats = (stats, operationTime) => {
  stats.operations++;
  stats.totalTime += operationTime;
  stats.averageTime = stats.totalTime / stats.operations;
  return stats;
};

export const createPerformanceResult = (operationTime, backend, averageTime, totalOperations) => ({
  operationTime: Math.round(operationTime),
  backend: backend,
  averageTime: Math.round(averageTime),
  totalOperations: totalOperations
});

export const logPerformance = (backend, operationTime, averageTime) => {
  console.log(`⚡ ${backend.toUpperCase()}: ${Math.round(operationTime)}ms (avg: ${Math.round(averageTime)}ms)`);
};

export const getCameraConfig = () => {
  const mobile = isMobileDevice();
  return {
    defaultFPS: CAMERA_CONFIG.defaultFPS,
    fpsRange: CAMERA_CONFIG.fpsRange,
    resolution: mobile
      ? CAMERA_CONFIG.mobileResolution
      : CAMERA_CONFIG.desktopResolution,
    facingMode: mobile
      ? CAMERA_CONFIG.mobileFacingMode
      : CAMERA_CONFIG.desktopFacingMode
  };
};

export const getCameraConstraints = (selectedCameraId) => {
  const config = getCameraConfig();
  return {
    video: {
      deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
      width: { ideal: config.resolution.width },
      height: { ideal: config.resolution.height },
      facingMode: config.facingMode,
      frameRate: { ideal: config.defaultFPS }
    }
  };
};