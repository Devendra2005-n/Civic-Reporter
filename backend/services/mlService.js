import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ort from 'onnxruntime-node';
import sharp from 'sharp';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let onnxSession = null;
let classNames = ['garbage_cardboard', 'garbage_glass', 'garbage_metal', 'garbage_paper', 'garbage_plastic', 'garbage_trash', 'other', 'pothole'];

async function getOnnxSession() {
  if (onnxSession) return onnxSession;

  const candidatePaths = [
    path.join(__dirname, '..', 'ml', 'civic_model.onnx'),
    path.join(__dirname, '..', '..', 'ml_service', 'civic_model.onnx'),
    path.join(process.cwd(), 'ml', 'civic_model.onnx'),
    path.join(process.cwd(), 'backend', 'ml', 'civic_model.onnx'),
    path.join(process.cwd(), 'ml_service', 'civic_model.onnx'),
  ];
  const classesCandidatePaths = [
    path.join(__dirname, '..', 'ml', 'classes.json'),
    path.join(__dirname, '..', '..', 'ml_service', 'classes.json'),
    path.join(process.cwd(), 'ml', 'classes.json'),
    path.join(process.cwd(), 'backend', 'ml', 'classes.json'),
    path.join(process.cwd(), 'ml_service', 'classes.json'),
  ];

  for (const cp of classesCandidatePaths) {
    if (fs.existsSync(cp)) {
      try {
        classNames = JSON.parse(fs.readFileSync(cp, 'utf8'));
        console.log(`✅ Loaded ${classNames.length} classes from: ${cp}`);
        break;
      } catch (err) {
        console.warn(`Failed reading classes from ${cp}:`, err.message);
      }
    }
  }

  for (const mp of candidatePaths) {
    if (fs.existsSync(mp)) {
      console.log(`Loading ONNX model from: ${mp}...`);
      onnxSession = await ort.InferenceSession.create(mp, {
        executionProviders: ['cpu'],
      });
      console.log('✅ ONNX model loaded successfully in Node.js!');
      return onnxSession;
    }
  }

  throw new Error('civic_model.onnx not found in candidates: ' + candidatePaths.join(', '));
}

export async function runOnnxInference(imageBytes) {
  const session = await getOnnxSession();

  // Resize shortest side to 256 then center-crop 224x224 (matching torchvision validation transforms)
  const meta = await sharp(imageBytes).metadata();
  let resizeOpts;
  if (meta.height && meta.width && meta.height < meta.width) {
    resizeOpts = { height: 256 };
  } else {
    resizeOpts = { width: 256 };
  }

  const resizedBuffer = await sharp(imageBytes)
    .rotate() // auto-orient based on EXIF
    .resize(resizeOpts)
    .toBuffer();

  const croppedBuffer = await sharp(resizedBuffer)
    .resize(224, 224, { fit: 'cover', position: 'center' })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Normalize with ImageNet mean/std
  const MEAN = [0.485, 0.456, 0.406];
  const STD = [0.229, 0.224, 0.225];
  const floatArr = new Float32Array(3 * 224 * 224);

  for (let i = 0; i < 224 * 224; i++) {
    const r = croppedBuffer[i * 3] / 255.0;
    const g = croppedBuffer[i * 3 + 1] / 255.0;
    const b = croppedBuffer[i * 3 + 2] / 255.0;

    floatArr[0 * 224 * 224 + i] = (r - MEAN[0]) / STD[0];
    floatArr[1 * 224 * 224 + i] = (g - MEAN[1]) / STD[1];
    floatArr[2 * 224 * 224 + i] = (b - MEAN[2]) / STD[2];
  }

  const tensor = new ort.Tensor('float32', floatArr, [1, 3, 224, 224]);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  const results = await session.run({ [inputName]: tensor });
  const logits = Array.from(results[outputName].data);

  // Softmax
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sumExps);

  let topClass = 0;
  let topProb = probs[0];
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > topProb) {
      topProb = probs[i];
      topClass = i;
    }
  }

  const rawProblemType = classNames[topClass] || 'other';
  // Normalize problem type: e.g. "garbage_plastic" -> "garbage", "pothole" -> "pothole"
  let problemType = rawProblemType;
  if (rawProblemType.startsWith('garbage')) {
    problemType = 'garbage';
  }

  const allProbs = {};
  classNames.forEach((name, idx) => {
    allProbs[name] = probs[idx];
  });

  return {
    problemType,
    rawProblemType,
    confidence: topProb,
    all_probabilities: allProbs,
    imageValidation: {
      isValid: rawProblemType !== 'other',
      reason: `ONNX Model predicted ${rawProblemType} with ${(topProb * 100).toFixed(2)}% confidence`,
      detectedContent: `Custom ML Classification: ${rawProblemType}`,
    },
    severity: topProb > 0.8 ? 'High' : 'Medium',
    engine: 'onnx-native',
  };
}

export async function predictImage(imageInput) {
  // 1. If ML_SERVICE_URL is set and imageInput is a URL string, try external microservice
  if (typeof imageInput === 'string' && process.env.ML_SERVICE_URL && process.env.ML_SERVICE_URL.trim() !== '') {
    try {
      const mlUrl = process.env.ML_SERVICE_URL.replace(/\/+$/, '') + '/predict';
      console.log(`[ML] Trying external ML microservice at ${mlUrl}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(mlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageInput }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        console.log('[ML] External microservice prediction successful:', data);
        let problemType = data.problemType || 'other';
        if (problemType.startsWith('garbage')) {
          problemType = 'garbage';
        }
        return {
          ...data,
          problemType,
          rawProblemType: data.problemType,
          engine: 'external-microservice',
        };
      }
      console.warn(`[ML] External microservice returned status ${resp.status}, falling back to built-in ONNX engine...`);
    } catch (extErr) {
      console.warn(`[ML] External microservice failed (${extErr.message}), falling back to built-in ONNX engine...`);
    }
  }

  // 2. Run built-in ONNX runtime in Node.js
  let imageBytes;
  if (Buffer.isBuffer(imageInput)) {
    console.log(`[ML] Running built-in ONNX model on in-memory image buffer (${imageInput.length} bytes)...`);
    imageBytes = imageInput;
  } else if (typeof imageInput === 'string') {
    console.log(`[ML] Running built-in ONNX model for image: ${imageInput}`);
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const imgResp = await fetch(imageInput);
      if (!imgResp.ok) {
        throw new Error(`Failed to fetch image from URL: ${imgResp.statusText}`);
      }
      const arrayBuffer = await imgResp.arrayBuffer();
      imageBytes = Buffer.from(arrayBuffer);
    } else {
      imageBytes = fs.readFileSync(imageInput);
    }
  } else {
    throw new Error('Invalid image input: expected file path string, URL string, or Buffer');
  }

  const prediction = await runOnnxInference(imageBytes);
  return prediction;
}

async function main() {
  const testFile = path.join(__dirname, '..', '..', 'test.webp');
  console.log('Testing with:', testFile);
  const res = await predictImage(testFile);
  console.log('Result:', JSON.stringify(res, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
