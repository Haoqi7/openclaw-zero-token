#!/usr/bin/env node
/**
 * 添加 8 个新 Web 平台的认证配置到 auth-profiles.json
 */

import fs from 'fs';
import path from 'path';

const AUTH_FILE = '.openclaw-state/agents/main/agent/auth-profiles.json';

// 读取现有配置
const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));

// 新平台的占位符配置
const newPlatforms = {
  'qwen-web': {
    type: 'api_key',
    provider: 'qwen-web',
    key: JSON.stringify({
      cookie: 'placeholder-cookie-please-login',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
    })
  },
  'yuanbao-web': {
    type: 'api_key',
    provider: 'yuanbao-web',
    key: JSON.stringify({
      cookie: 'placeholder-cookie-please-login',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
    })
  },
  'kimi-web': {
    type: 'api_key',
    provider: 'kimi-web',
    key: JSON.stringify({
      refreshToken: 'placeholder-token-please-login',
      cookie: 'placeholder-cookie-please-login',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
    })
  },
  'gemini-web': {
    type: 'api_key',
    provider: 'gemini-web',
    key: JSON.stringify({
      cookie: 'placeholder-cookie-please-login',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
    })
  },
  'grok-web': {
    type: 'api_key',
    provider: 'grok-web',
    key: JSON.stringify({
      authToken: 'placeholder-token-please-login',
      cookie: 'placeholder-cookie-please-login',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
    })
  },
  'z-web': {
    type: 'api_key',
    provider: 'z-web',
    key: JSON.stringify({
      cookie: 'placeholder-cookie-please-login',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
    })
  },
  'manus-web': {
    type: 'api_key',
    provider: 'manus-web',
    key: JSON.stringify({
      cookie: 'placeholder-cookie-please-login',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
    })
  }
};

// 添加新平台（保留 chatgpt-web，因为它已经存在）
let added = 0;
for (const [provider, config] of Object.entries(newPlatforms)) {
  const profileId = `${provider}:default`;
  if (!authData.profiles[profileId]) {
    authData.profiles[profileId] = config;
    authData.lastGood[provider] = profileId;
    added++;
    console.log(`✓ 添加 ${provider}`);
  } else {
    console.log(`- ${provider} 已存在，跳过`);
  }
}

// 写回文件
fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));
console.log(`\n完成！添加了 ${added} 个新平台的认证配置`);
console.log('\n注意：这些是占位符配置，你需要：');
console.log('1. 在浏览器中登录各个平台');
console.log('2. 运行 onboard 命令选择对应平台');
console.log('3. 或者手动更新 auth-profiles.json 中的 cookie');
