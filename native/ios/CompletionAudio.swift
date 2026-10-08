import AVFoundation
import Foundation
import React

@objc(CompletionAudio)
public class CompletionAudio: NSObject, RCTInvalidating {
  // Rewinding one player mid-cue hard-cuts the waveform (a click) and a
  // play() straight after pause() is sometimes silent. Each tap takes an idle
  // voice instead, so earlier cues ring out under the new one.
  private static let voiceCount = 4

  // Decoding and playback operations must never block the UI or JS threads.
  private let audioQueue = DispatchQueue(label: "com.azora.completion-audio", qos: .userInitiated)
  private var voices: [String: [AVAudioPlayer]] = [:]
  private var nextVoice: [String: Int] = [:]
  // A scheduled player may still report isPlaying == false before its start.
  // Reserve that voice through its cue so another pop cannot overwrite it.
  private var reservedUntil: [String: [TimeInterval]] = [:]
  private var invalidated = false

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc(prepare:uri:resolver:rejecter:)
  func prepare(_ ownerId: String, uri: String,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      guard !self.invalidated else {
        reject("completion_audio_invalidated", "Audio module has been released.", nil)
        return
      }
      guard !ownerId.isEmpty, let url = URL(string: uri), url.isFileURL else {
        reject("completion_audio_invalid_uri", "A local audio file and owner ID are required.", nil)
        return
      }
      do {
        let pool = try (0..<Self.voiceCount).map { _ in try AVAudioPlayer(contentsOf: url) }
        guard pool.allSatisfy({ $0.prepareToPlay() }) else {
          reject("completion_audio_prepare_failed", "Could not prepare completion audio.", nil)
          return
        }
        self.voices[ownerId]?.forEach { $0.stop() }
        self.voices[ownerId] = pool
        self.nextVoice[ownerId] = 0
        self.reservedUntil[ownerId] = Array(repeating: 0, count: pool.count)
        resolve(nil)
      } catch {
        reject("completion_audio_prepare_failed", "Could not load completion audio.", error)
      }
    }
  }

  @objc(restart:volume:resolver:rejecter:)
  func restart(_ ownerId: String, volume: NSNumber,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      guard !self.invalidated, let pool = self.voices[ownerId], !pool.isEmpty else {
        reject("completion_audio_not_prepared", "Completion audio is not prepared.", nil)
        return
      }
      let start = self.nextVoice[ownerId] ?? 0
      let order = (0..<pool.count).map { (start + $0) % pool.count }
      let now = pool[0].deviceCurrentTime
      let reservations = self.reservedUntil[ownerId] ?? Array(repeating: 0, count: pool.count)
      // Round-robin from the oldest voice; only steal it if every voice is busy.
      guard let index = order.first(where: { reservations[$0] <= now && !pool[$0].isPlaying })
        ?? order.first(where: { reservations[$0] <= now }) else {
        reject("completion_audio_busy", "All completion audio voices are scheduled.", nil)
        return
      }
      let player = pool[index]
      self.nextVoice[ownerId] = (index + 1) % pool.count
      if player.isPlaying { player.stop() }
      player.currentTime = 0
      let requestedVolume = volume.floatValue
      player.volume = requestedVolume.isFinite ? max(0, min(1, requestedVolume)) : 0
      guard player.play() else {
        reject("completion_audio_play_failed", "Could not play completion audio.", nil)
        return
      }
      if let idle = order.first(where: { reservations[$0] <= now && !pool[$0].isPlaying }) {
        pool[idle].prepareToPlay()
      }
      resolve(nil)
    }
  }

  @objc(schedule:volume:targetTimeMs:resolver:rejecter:)
  func schedule(_ ownerId: String, volume: NSNumber, targetTimeMs: NSNumber,
                resolver resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      guard !self.invalidated, let pool = self.voices[ownerId], !pool.isEmpty else {
        reject("completion_audio_not_prepared", "Completion audio is not prepared.", nil)
        return
      }
      let target = targetTimeMs.doubleValue / 1000
      guard target.isFinite else {
        reject("completion_audio_invalid_time", "A finite completion audio time is required.", nil)
        return
      }
      let now = pool[0].deviceCurrentTime
      let remaining = target - Date().timeIntervalSince1970
      // A busy bridge must not turn an expired cue into a visibly late pop.
      guard remaining > 0 else { resolve(nil); return }
      let start = self.nextVoice[ownerId] ?? 0
      let order = (0..<pool.count).map { (start + $0) % pool.count }
      var reservations = self.reservedUntil[ownerId] ?? Array(repeating: 0, count: pool.count)
      guard let index = order.first(where: { reservations[$0] <= now && !pool[$0].isPlaying }) else {
        reject("completion_audio_busy", "No completion audio voice is available.", nil)
        return
      }
      let player = pool[index]
      player.currentTime = 0
      let requestedVolume = volume.floatValue
      player.volume = requestedVolume.isFinite ? max(0, min(1, requestedVolume)) : 0
      let deviceStart = now + remaining
      guard target > Date().timeIntervalSince1970, deviceStart > player.deviceCurrentTime else {
        resolve(nil)
        return
      }
      guard player.play(atTime: deviceStart) else {
        reject("completion_audio_play_failed", "Could not schedule completion audio.", nil)
        return
      }
      reservations[index] = deviceStart + player.duration
      self.reservedUntil[ownerId] = reservations
      self.nextVoice[ownerId] = (index + 1) % pool.count
      resolve(nil)
    }
  }

  @objc(stop:resolver:rejecter:)
  func stop(_ ownerId: String,
            resolver resolve: @escaping RCTPromiseResolveBlock,
            rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      self.voices[ownerId]?.forEach {
        $0.stop()
        $0.currentTime = 0
        $0.prepareToPlay()
      }
      if let pool = self.voices[ownerId] {
        self.reservedUntil[ownerId] = Array(repeating: 0, count: pool.count)
      }
      resolve(nil)
    }
  }

  @objc(release:resolver:rejecter:)
  func release(_ ownerId: String,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      self.voices.removeValue(forKey: ownerId)?.forEach { $0.stop() }
      self.nextVoice.removeValue(forKey: ownerId)
      self.reservedUntil.removeValue(forKey: ownerId)
      resolve(nil)
    }
  }

  @objc public func invalidate() {
    audioQueue.async {
      self.invalidated = true
      self.voices.values.joined().forEach { $0.stop() }
      self.voices.removeAll()
      self.nextVoice.removeAll()
      self.reservedUntil.removeAll()
    }
  }
}
