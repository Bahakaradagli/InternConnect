const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 👇 burada assetExts'i alıyoruz
const assetExts = config.resolver.assetExts;

// 👇 ve mp4'ü ekliyoruz (eğer zaten yoksa)
if (!assetExts.includes('mp4')) {
  assetExts.push('mp4');
}

config.resolver.assetExts = assetExts;

module.exports = config;