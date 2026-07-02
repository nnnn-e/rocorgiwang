export class WaveForm {
  async generate(url: string): Promise<number[]> {
    try {
      const audioContext = new AudioContext()
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const channelData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate
      const peaks: number[] = []
      const interval = Math.floor(sampleRate / 500) // Adjust for desired peak density

      for (let i = 0; i < channelData.length; i += interval) {
        let sum = 0
        for (let j = 0; j < interval; j++) {
          sum += Math.abs(channelData[i + j] || 0) // Handle out-of-bounds access
        }
        const average = sum / interval
        peaks.push(average)
      }

      return peaks
    } catch (error: any) {
      console.error("Error generating waveform:", error)
      throw new Error(error.message || "Failed to generate waveform")
    }
  }
}
