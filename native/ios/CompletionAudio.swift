import AVFoundation
import Foundation
import React

@objc(CompletionAudio)
public class CompletionAudio: NSObject, RCTInvalidating {
  // Decoding and playback operations must never block the UI or JS threads.
  private let audioQueue = DispatchQueue(label: "com.azora.completion-audio", qos: .userInitiated)
  private var players: [String: AVAudioPlayer] = [:]
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
        let player = try AVAudioPlayer(contentsOf: url)
        guard player.prepareToPlay() else {
          reject("completion_audio_prepare_failed", "Could not prepare completion audio.", nil)
          return
        }
        self.players[ownerId]?.stop()
        self.players[ownerId] = player
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
      guard !self.invalidated, let player = self.players[ownerId] else {
        reject("completion_audio_not_prepared", "Completion audio is not prepared.", nil)
        return
      }
      // Pause silences the old cue while retaining its prepared resources.
      player.pause()
      player.currentTime = 0
      let requestedVolume = volume.floatValue
      player.volume = requestedVolume.isFinite ? max(0, min(1, requestedVolume)) : 0
      guard player.play() else {
        reject("completion_audio_play_failed", "Could not play completion audio.", nil)
        return
      }
      resolve(nil)
    }
  }

  @objc(stop:resolver:rejecter:)
  func stop(_ ownerId: String,
            resolver resolve: @escaping RCTPromiseResolveBlock,
            rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      self.players[ownerId]?.pause()
      self.players[ownerId]?.currentTime = 0
      resolve(nil)
    }
  }

  @objc(release:resolver:rejecter:)
  func release(_ ownerId: String,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      self.players.removeValue(forKey: ownerId)?.stop()
      resolve(nil)
    }
  }

  @objc public func invalidate() {
    audioQueue.async {
      self.invalidated = true
      self.players.values.forEach { $0.stop() }
      self.players.removeAll()
    }
  }
}
