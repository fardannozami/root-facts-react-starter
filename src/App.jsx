import { useEffect, useRef, useState, useCallback } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { DetectionService } from './services/DetectionService';
import { CameraService } from './services/CameraService';
import { RootFactsService } from './services/RootFactsService';
import { createDelay } from './utils/common';
import { isValidDetection, APP_CONFIG } from './utils/config';

function App() {
  const { state, actions } = useAppState();
  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);
  const [currentTone, setCurrentTone] = useState('normal');

  // TODO [Basic] Inisialisasi layanan deteksi, kamera, dan generator fakta saat aplikasi dimuat
  useEffect(() => {
    const initServices = async () => {
      try {
        actions.setModelStatus('Memuat model AI...');
        actions.setError(null);

        const detector = new DetectionService();
        await detector.loadModel();

        const camera = new CameraService();

        let generator = null;
        try {
          generator = new RootFactsService((progress) => {
            actions.setModelStatus(progress.message);
          });
          await generator.loadModel();
        } catch (error) {
          console.warn('⚠️ Layanan fakta nutrisi/sayur gagal dimuat', error);
        }

        actions.setServices({ detector, camera, generator });
        actions.setModelStatus('Model AI Siap');
      } catch (error) {
        actions.setModelStatus('Model gagal dimuat');
        actions.setError(`Gagal menginisialisasi: ${error.message}`);
      }
    };

    initServices();
  }, [actions]);

  // TODO [Basic] Bersihkan sumber daya saat komponen ditinggalkan
  useEffect(() => {
    return () => {
      if (detectionCleanupRef.current) {
        detectionCleanupRef.current();
      }
      if (state.services.camera) {
        state.services.camera.stopCamera();
      }
    };
  }, [state.services.camera]);

  // TODO [Basic] Fungsi untuk memulai loop deteksi
  const startDetection = useCallback(() => {
    let animationId = null;
    let isActive = true;

    const detectLoop = async () => {
      if (!isActive) {
        return;
      }
      if (!isRunningRef.current) {
        setTimeout(() => {
          if (isActive) {
            animationId = requestAnimationFrame(detectLoop);
          }
        }, APP_CONFIG.detectionRetryInterval);
        return;
      }

      try {
        const canvas = state.services.camera?.captureFrame();
        if (!canvas) {
          if (isActive && isRunningRef.current) {
            animationId = requestAnimationFrame(detectLoop);
          }
          return;
        }

        const result = await state.services.detector.predict(canvas);

        if (isValidDetection(result)) {
          isActive = false;
          isRunningRef.current = false;
          actions.setRunning(false);
          actions.setAppState('analyzing');
          state.services.camera?.stopCamera();

          await createDelay(APP_CONFIG.analyzingDelay);

          actions.setDetectionResult(result);
          actions.setAppState('result');
          actions.setFunFactData(null);

          if (state.services.generator?.isReady()) {
            await createDelay(APP_CONFIG.factsGenerationDelay);
            try {
              const funFactResult = await state.services.generator.generateFacts(result.className);
              actions.setFunFactData(funFactResult);
            } catch (generationError) {
              console.error('❌ Gagal menghasilkan fakta unik', generationError);
              actions.setFunFactData('error');
            }
          } else {
            actions.setFunFactData('error');
          }
          return;
        }
      } catch (error) {
        console.error('❌ Error deteksi', error);
        actions.setError(`Deteksi gagal: ${error.message}`);
      }

      if (isActive && isRunningRef.current) {
        animationId = requestAnimationFrame(detectLoop);
      }
    };

    detectLoop();

    return () => {
      isActive = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [state.services, actions]);

  // TODO [Basic] Fungsi untuk memulai dan menghentikan kamera
  const startCamera = useCallback(async () => {
    try {
      actions.resetResults();

      isRunningRef.current = true;
      actions.setRunning(true);
      actions.setAppState('analyzing');

      await state.services.camera?.startCamera();

      // Tunggu jeda inisialisasi kamera agar sensor cahaya beradaptasi
      await createDelay(APP_CONFIG.cameraStartDelay || 1500);

      const cleanup = startDetection();
      detectionCleanupRef.current = cleanup;
    } catch (error) {
      console.error('❌ Gagal memulai kamera', error);
      isRunningRef.current = false;
      actions.setRunning(false);
      actions.setAppState('idle');
      throw error;
    }
  }, [state.services, actions, startDetection]);

  const stopCamera = useCallback(() => {
    if (detectionCleanupRef.current) {
      detectionCleanupRef.current();
      detectionCleanupRef.current = null;
    }

    isRunningRef.current = false;
    actions.setRunning(false);
    actions.setAppState('idle');
    state.services.camera?.stopCamera();
    actions.resetResults();
  }, [state.services, actions]);

  const handleToggleCamera = useCallback(async () => {
    if (!state.services.detector?.isLoaded()) {
      actions.setError('Model deteksi AI belum siap. Harap tunggu inisialisasi selesai.');
      return;
    }

    try {
      actions.setError(null);
      if (!isRunningRef.current) {
        await startCamera();
      } else {
        stopCamera();
      }
    } catch (error) {
      console.error('❌ Camera toggle error:', error);
      actions.setError(error.message);
    }
  }, [state.services.detector, actions, startCamera, stopCamera]);

  // TODO [Advance] Fungsi untuk mengubah nada fakta yang dihasilkan
  const handleToneChange = useCallback((tone) => {
    setCurrentTone(tone);
    if (state.services.generator) {
      state.services.generator.setTone(tone);
    }
  }, [state.services.generator]);

  // TODO [Skilled] Fungsi untuk menyalin fakta ke clipboard
  const handleCopyFact = useCallback(async () => {
    if (!state.funFactData || state.funFactData === 'error') return;
    try {
      await navigator.clipboard.writeText(state.funFactData);
      alert('Fakta berhasil disalin!');
    } catch (err) {
      console.error('Failed to copy text:', err);
      actions.setError('Gagal menyalin teks ke clipboard.');
    }
  }, [state.funFactData, actions]);

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
          onToggleCamera={handleToggleCamera}
          onToneChange={handleToneChange}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={handleCopyFact}
        />
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js & Transformers.js</p>
      </footer>

      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '380px',
          padding: '0.875rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.8125rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
