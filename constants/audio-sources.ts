// 音频源列表
export const AUDIO_SOURCES = [
  // 添加新的音频文件
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite//Nick-Cave-The-Bad-Seeds-O-Children.mp3",
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/chat-images/WorkBGM/Code%20&%20Coffee%20(1).mp3", // 新添加的音频
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite//A.mp3",
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Music/Animals%20-%20The%20House%20Of%20The%20Rising%20Sun.mp3",
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Music/Sittin%20on%20the%20dock%20of%20the%20day.MP3",
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Music/Velvet%20Underground%20-%20Pale%20Blue%20Eyes.mp3",
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/Music/Nina%20Simone%20-%20Feeling%20Good.MP3",
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/BGM/Cody%20Fry,Abby%20Cates%20-%20Things%20You%20Said.mp3",
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite/BGM/Hayd%20-%20Head%20In%20The%20Clouds.mp3",
  "https://files.catbox.moe/1nc8ou.mp3",
  "https://files.catbox.moe/vh76hc.mp3",
  "https://files.catbox.moe/0opkvw.mp3",

  // 保留现有的音频文件
  "https://files.catbox.moe/xnh3es.mp3",
  "https://files.catbox.moe/38dfhp.mp3",
  "https://files.catbox.moe/l398aa.mp3",
  // Using catbox.moe provided audio links
  "https://files.catbox.moe/nmptpo.mp3",
  "https://files.catbox.moe/ocvool.mp3",
  "https://files.catbox.moe/zn730g.mp3",
  "https://files.catbox.moe/vtf289.mp3",
  "https://files.catbox.moe/h8g599.mp3",
  "https://files.catbox.moe/dfhip1.mp3",
  "https://files.catbox.moe/1mt64l.mp3",
  // Retain some original audio as backup
  "https://files.catbox.moe/88uydp.mp3",
  "https://zmrurobjorvsmoypwxhk.supabase.co/storage/v1/object/public/personalsite//A.mp3",
]

// 创建一个非常短的静音音频作为最后的备用方案
export const SILENT_AUDIO =
  "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"

// 波形样式类型定义
export type WaveformStyle =
  | "bars" // 条形波形
  | "particles" // 粒子波形
  | "soundfield" // 声场波形

// 调试设置
export const DEBUG_ENABLED = false

// 创建一个条件日志函数
export const debugLog = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.log(...args)
  }
}

// 添加条件错误日志函数
export const debugError = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.error(...args)
  }
}

// 音频数据接口
export interface AudioData {
  frequencyData: Uint8Array
  timeData: Uint8Array
  averageIntensity: number
  bassIntensity: number
  midIntensity: number
  trebleIntensity: number
}
