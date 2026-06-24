export const APP_CONFIG = {
  detectionConfidenceThreshold: 70,
  analyzingDelay: 2000,
  factsGenerationDelay: 2000,
  detectionRetryInterval: 100
};

export const TONE_CONFIG = {
  availableTones: [
    { value: 'normal', label: 'Normal' },
    { value: 'funny', label: 'Lucu' },
    { value: 'professional', label: 'Profesional' },
    { value: 'casual', label: 'Santai' }
  ],
  defaultTone: 'normal'
};

export const isValidDetection = (result) => {
  const { detectionConfidenceThreshold } = APP_CONFIG;
  return result && result.isValid && result.confidence >= detectionConfidenceThreshold;
};

export const TENSORFLOW_CONFIG = {
  modelPath: '/model/model.json',
  metadataPath: '/model/metadata.json',
  inputSize: [224, 224],
  normalizationFactor: 255.0,
  confidenceThresholds: {
    excellent: 70,
    good: 50
  }
};

export const CAMERA_CONFIG = {
  defaultFPS: 30,
  fpsRange: { min: 15, max: 60 },
  desktopResolution: { width: 640, height: 480 },
  mobileResolution: { width: 480, height: 640 },
  desktopFacingMode: 'user',
  mobileFacingMode: 'environment'
};