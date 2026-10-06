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
      // Round-robin from the oldest voice; only steal it if every voice is busy.
      let index = order.first { !pool[$0].isPlaying } ?? start
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
      pool[self.nextVoice[ownerId] ?? 0].prepareToPlay()
      resolve(nil)
    }
  }

  @objc(stop:resolver:rejecter:)
  func stop(_ ownerId: String,
            resolver resolve: @escaping RCTPromiseResolveBlock,
            rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      self.voices[ownerId]?.forEach {
        $0.pause()
        $0.currentTime = 0
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
      resolve(nil)
    }
  }

  @objc public func invalidate() {
    audioQueue.async {
      self.invalidated = true
      self.voices.values.joined().forEach { $0.stop() }
      self.voices.removeAll()
      self.nextVoice.removeAll()
    }
  }
}
