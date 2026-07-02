/**
 * 生成合成的音频数据，用于在无法访问实际音频数据时模拟可视化效果
 * @param time 当前时间戳，用于创建动态变化
 * @param length 要生成的数据点数量
 * @returns 合成的音���数据数组
 */
export function generateSyntheticAudioData(time: number, length = 128): Uint8Array {
  const dataArray = new Uint8Array(length)

  // 时间因子，控制动画速度
  const t = time * 0.001

  for (let i = 0; i < length; i++) {
    // 创建多个正弦波的叠加，产生更自然的波形
    // 不同频率和相位的正弦波组合
    const normalizedIndex = i / length

    // 基础波形
    const value =
      128 +
      // 低频波形 - 大幅度变化
      50 * Math.sin(normalizedIndex * Math.PI * 2 + t * 1.5) +
      // 中频波形 - 中等变化
      30 * Math.sin(normalizedIndex * Math.PI * 4 + t * 2.5) +
      // 高频波形 - 小幅度快速变化
      15 * Math.sin(normalizedIndex * Math.PI * 8 + t * 3.5)

    // 确保值在 0-255 范围内
    dataArray[i] = Math.min(255, Math.max(0, value))
  }

  return dataArray
}

/**
 * 计算音频数据的平均强度
 * @param dataArray 音频数据数组
 * @returns 归一化的平均强度 (0-1)
 */
export function calculateAverageIntensity(dataArray: Uint8Array): number {
  if (!dataArray || dataArray.length === 0) return 0

  let sum = 0
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i]
  }

  // 归一化到 0-1 范围
  return sum / (dataArray.length * 255)
}
