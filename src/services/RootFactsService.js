import { pipeline } from '@huggingface/transformers';
import { TONE_CONFIG, TRANSFORMERS_CONFIG } from '../utils/config.js';
import { createModelProgressCallback, isWebGPUSupported, logError, createPerformanceStats } from '../utils/common.js';

export class RootFactsService {
  constructor(onProgress) {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = TRANSFORMERS_CONFIG;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
    this.performanceStats = createPerformanceStats();
    this.onProgress = onProgress; // Callback untuk update progress download
  }

  // TODO [Basic] Muat model dan inisialisasi pipeline text2text-generation
  // TODO [Advance] Implementasikan strategi Backend Adaptive
  async loadModel() {
    try {
      const device = isWebGPUSupported() ? 'webgpu' : 'wasm';

      this.generator = await pipeline(
        'text2text-generation',
        this.config.modelName,
        {
          dtype: 'q4',
          device,
          progress_callback: createModelProgressCallback(this.onProgress),
        }
      );

      this.isModelLoaded = true;
      this.currentBackend = device;

      return {
        success: true,
        model: this.config.modelName,
        backend: this.currentBackend
      };

    } catch (error) {
      logError('Kesalahan memuat model Transformers.js', error);
      throw new Error(`Gagal memuat model generasi konten: ${error.message}`);
    }
  }

  // TODO [Advance] Konfigurasi tone fakta yang dihasilkan
  setTone(tone) {
    const toneExists = TONE_CONFIG.availableTones.some((t) => t.value === tone);
    this.currentTone = toneExists ? tone : TONE_CONFIG.defaultTone;
  }

  // TODO [Basic] Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
  // TODO [Skilled] Konfigurasikan parameter generasi berdasarkan kebutuhan
  // TODO [Advance] Implemenasikan parameter tone untuk mengatur nada fakta yang dihasilkan
  async generateFacts(vegetableName) {
    if (!this.isReady()) {
      throw new Error('Model generator belum dimuat.');
    }

    this.isGenerating = true;

    try {
      let prompt = '';

      switch (this.currentTone) {
      case 'funny':
        prompt = `Write a funny, humorous, and entertaining fun fact about the vegetable ${vegetableName}.`;
        break;
      case 'professional':
        prompt = `Write a scientifically detailed, educational, and professional fun fact about the vegetable ${vegetableName}.`;
        break;
      case 'casual':
        prompt = `Write a casual, friendly, and cool fun fact about the vegetable ${vegetableName}.`;
        break;
      case 'normal':
      default:
        prompt = `Write an interesting and unique fun fact about the vegetable ${vegetableName}.`;
        break;
      }

      const response = await this.generator(prompt, {
        max_new_tokens: Math.min(this.config.maxTokens || 150, 150),
        temperature: this.config.temperature !== undefined ? this.config.temperature : 0.7,
        top_p: this.config.topP || 0.8,
        do_sample: this.config.doSample !== undefined ? this.config.doSample : true,
        repetition_penalty: this.config.repetitionPenalty || 1.2
      });

      const generatedText = response[0]?.generated_text || '';
      let cleanText = generatedText.trim();
      if (cleanText.toLowerCase().startsWith(prompt.toLowerCase())) {
        cleanText = cleanText.substring(prompt.length).trim();
      }
      return cleanText;
    } catch (error) {
      console.error('Failed to generate facts:', error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  // TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
  isReady() {
    return this.isModelLoaded && !!this.generator;
  }
}
