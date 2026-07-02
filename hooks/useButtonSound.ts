"use client"

import { useRef, useEffect } from "react"

export interface ButtonSoundOptions {
  volume?: number
  enabled?: boolean
}

// This hook is likely responsible for playing sounds when buttons are clicked, including the send message button.
// We'll modify it to disable sounds for message sending.
export function useButtonSound(soundUrl: string, options: ButtonSoundOptions = {}) {
  const { volume = 0.5, enabled = false } = options // Change default enabled to false

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create and configure audio element
    if (!audioRef.current) {
      const audio = new Audio(soundUrl)
      audio.volume = volume
      audio.preload = "auto"
      audioRef.current = audio
    }

    return () => {
      // Clean up
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
    }
  }, [soundUrl, volume])

  useEffect(() => {
    // Update volume if it changes
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const play = () => {
    if (!enabled || !audioRef.current) return

    try {
      // Reset to start
      audioRef.current.currentTime = 0

      // Play the sound
      const playPromise = audioRef.current.play()

      // Handle any potential play errors
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Error playing button sound:", error)
        })
      }
    } catch (error) {
      console.warn("Failed to play button sound:", error)
    }
  }

  return { play }
}
