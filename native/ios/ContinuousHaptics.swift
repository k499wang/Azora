import CoreHaptics
import Foundation

@objc(ContinuousHaptics)
public class ContinuousHaptics: NSObject {
  private var engine: CHHapticEngine?
  private var player: CHHapticAdvancedPatternPlayer?

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  private func ensureEngine() throws {
    if engine != nil { return }
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
    let newEngine = try CHHapticEngine()
    newEngine.stoppedHandler = { [weak self] _ in
      self?.engine = nil
      self?.player = nil
    }
    newEngine.resetHandler = { [weak self] in
      try? self?.engine?.start()
    }
    try newEngine.start()
    engine = newEngine
  }

  @objc(start:sharpness:duration:)
  func start(_ intensity: NSNumber, sharpness: NSNumber, duration: NSNumber) {
    DispatchQueue.main.async {
      do {
        try self.ensureEngine()
        guard let engine = self.engine else { return }

        try? self.player?.stop(atTime: 0)
        self.player = nil

        let intensityParam = CHHapticEventParameter(
          parameterID: .hapticIntensity,
          value: intensity.floatValue
        )
        let sharpnessParam = CHHapticEventParameter(
          parameterID: .hapticSharpness,
          value: sharpness.floatValue
        )
        let event = CHHapticEvent(
          eventType: .hapticContinuous,
          parameters: [intensityParam, sharpnessParam],
          relativeTime: 0,
          duration: max(0.05, min(30.0, duration.doubleValue))
        )
        let pattern = try CHHapticPattern(events: [event], parameters: [])
        let advancedPlayer = try engine.makeAdvancedPlayer(with: pattern)
        try advancedPlayer.start(atTime: CHHapticTimeImmediate)
        self.player = advancedPlayer
      } catch {
        // best-effort; silent on failure
      }
    }
  }

  @objc func stop() {
    DispatchQueue.main.async {
      try? self.player?.stop(atTime: 0)
      self.player = nil
    }
  }
}
