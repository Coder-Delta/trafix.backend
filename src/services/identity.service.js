import { dataStore, HOTLIST_PLATES } from '../store/persistence.js';

/**
 * Calculates Cosine Similarity between two 512D feature vectors.
 * Returns value between -1.0 and 1.0 (>= 0.85 indicates strong visual match).
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Calculates Great-Circle distance in kilometers between two lat/lng coordinates (Haversine Formula).
 */
export const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const identityService = {
  /**
   * Resolves vehicle global identity using:
   * 1. License Plate (Exact/Normalized OCR match)
   * 2. Spatial-Temporal Cloned Plate Anomaly Detection
   * 3. 512D Appearance Vector (Re-ID MobileNetV3 Cosine Similarity)
   * 4. Watchlist / Hotlist Matching
   */
  async resolveIdentity(event) {
    const {
      camera_id,
      observed_at,
      vehicle_type = 'car',
      plate_number,
      vehicle_embedding,
      vehicle_confidence = 0.95,
      bounding_box,
    } = event;

    const cleanPlate = plate_number ? plate_number.replace(/[\s-]/g, '').toUpperCase() : null;
    let anomalyAlert = null;
    const currentCamera = dataStore.getCamera(camera_id);

    // 1. Check License Plate Match
    if (cleanPlate && cleanPlate !== 'NONE' && cleanPlate !== 'UNKNOWN') {
      const existing = dataStore.findVehicleByPlate(cleanPlate);
      if (existing) {
        // Check for Cloned Plate Anomaly
        if (existing.camera_id !== camera_id) {
          const prevCamera = dataStore.getCamera(existing.camera_id);
          if (prevCamera && currentCamera) {
            const distKm = haversineDistanceKm(
              prevCamera.latitude,
              prevCamera.longitude,
              currentCamera.latitude,
              currentCamera.longitude
            );

            // Calculate time difference in seconds
            let timeDiffSec = 30; // default conservative
            try {
              const t1 = new Date(existing.last_seen_at || existing.detected_at).getTime();
              const t2 = new Date(observed_at).getTime();
              timeDiffSec = Math.max(1, Math.abs((t2 - t1) / 1000));
            } catch {}

            const speedKmh = (distKm / (timeDiffSec / 3600));

            // If speed exceeds 120 km/h or distance > 1.5km within 30 seconds
            if (speedKmh > 120 || (distKm > 1.5 && timeDiffSec < 45)) {
              anomalyAlert = {
                id: `ALT_${Date.now()}`,
                type: 'cloned_plate',
                severity: 'critical',
                plate_number: cleanPlate,
                vehicle_type: existing.vehicle_type || vehicle_type,
                description: `Simultaneous detection at ${prevCamera.name} and ${currentCamera.name} (${Math.round(distKm * 10) / 10} km apart within ${Math.round(timeDiffSec)}s). Physical velocity of ${Math.round(speedKmh)} km/h impossible.`,
                timestamp: new Date().toISOString(),
                cameras: [prevCamera.camera_id, currentCamera.camera_id],
              };
              dataStore.addAlert(anomalyAlert);
            }
          }
        }

        // Update existing vehicle
        existing.last_seen_at = observed_at;
        existing.detected_at = observed_at;
        existing.camera_id = camera_id;
        existing.camera_name = currentCamera?.name || camera_id;
        existing.latitude = currentCamera?.latitude || existing.latitude;
        existing.longitude = currentCamera?.longitude || existing.longitude;
        if (!existing.camera_ids.includes(camera_id)) {
          existing.camera_ids.push(camera_id);
        }

        // Update embedding if provided (moving average)
        if (Array.isArray(vehicle_embedding) && vehicle_embedding.length > 0) {
          if (Array.isArray(existing.embedding)) {
            for (let i = 0; i < existing.embedding.length; i++) {
              existing.embedding[i] = 0.8 * existing.embedding[i] + 0.2 * vehicle_embedding[i];
            }
          } else {
            existing.embedding = vehicle_embedding;
          }
        }

        dataStore.saveVehicle(existing);
        return {
          vehicle: existing,
          isNew: false,
          matchedBy: 'plate',
          anomalyAlert,
        };
      }
    }

    // 2. Check Appearance Vector Match (Cosine Similarity over 512D Embeddings)
    if (Array.isArray(vehicle_embedding) && vehicle_embedding.length > 0) {
      let bestMatch = null;
      let highestSim = 0;
      const SIMILARITY_THRESHOLD = 0.78;

      for (const candidate of dataStore.getAllVehicles()) {
        if (candidate.embedding && Array.isArray(candidate.embedding)) {
          const sim = cosineSimilarity(vehicle_embedding, candidate.embedding);
          if (sim > highestSim) {
            highestSim = sim;
            bestMatch = candidate;
          }
        }
      }

      if (bestMatch && highestSim >= SIMILARITY_THRESHOLD) {
        console.log(`[RE-ID MATCH] Vehicle ${bestMatch.vehicle_id} (${bestMatch.plate_number}) Re-Identified at ${currentCamera?.name || camera_id} (sim: ${(highestSim * 100).toFixed(1)}%)`);
        // Visual Re-ID matched across cameras without requiring plate!
        bestMatch.last_seen_at = observed_at;
        bestMatch.detected_at = observed_at;
        bestMatch.camera_id = camera_id;
        bestMatch.camera_name = currentCamera?.name || camera_id;
        bestMatch.latitude = currentCamera?.latitude || bestMatch.latitude;
        bestMatch.longitude = currentCamera?.longitude || bestMatch.longitude;
        if (!bestMatch.camera_ids.includes(camera_id)) {
          bestMatch.camera_ids.push(camera_id);
        }

        dataStore.saveVehicle(bestMatch);
        return {
          vehicle: bestMatch,
          isNew: false,
          matchedBy: 'embedding',
          similarity: highestSim,
          anomalyAlert,
        };
      }
    }

    // 3. Register New Global Vehicle Identity
    const newVehicleId = `VH_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const assignedPlate = cleanPlate || event.local_track_id || `WB_${newVehicleId.substring(3)}`;

    const newVehicle = {
      vehicle_id: newVehicleId,
      id: newVehicleId,
      local_track_id: event.local_track_id || null,
      plate_number: assignedPlate,
      plateNumber: assignedPlate,
      vehicle_type: vehicle_type,
      vehicleType: vehicle_type,
      color: 'Silver',
      confidence: vehicle_confidence,
      camera_id: camera_id,
      cameraId: camera_id,
      camera_name: currentCamera?.name || camera_id,
      cameraName: currentCamera?.name || camera_id,
      latitude: currentCamera?.latitude || 22.5535,
      longitude: currentCamera?.longitude || 88.3525,
      first_seen_at: observed_at,
      last_seen_at: observed_at,
      detected_at: observed_at,
      detectedAt: observed_at,
      camera_ids: [camera_id],
      embedding: Array.isArray(vehicle_embedding) ? vehicle_embedding : null,
    };

    // 4. Hotlist / Watchlist Match Check
    if (HOTLIST_PLATES.has(assignedPlate)) {
      anomalyAlert = {
        id: `ALT_${Date.now()}`,
        type: 'hotlist_match',
        severity: 'high',
        plate_number: assignedPlate,
        vehicle_type: vehicle_type,
        description: `Flagged in West Bengal Police FIR-2026-BEL-04 (Commercial Cargo Theft). Detected entering ${currentCamera?.name || camera_id}.`,
        timestamp: new Date().toISOString(),
        cameras: [camera_id],
      };
      dataStore.addAlert(anomalyAlert);
    }

    dataStore.saveVehicle(newVehicle);

    return {
      vehicle: newVehicle,
      isNew: true,
      matchedBy: 'created',
      anomalyAlert,
    };
  },
};

export default identityService;
