#!/usr/bin/env node

import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';

function getRandomMessage() {
  try {
    const messages = readFileSync('test-messages.txt', 'utf-8')
      .split('\n')
      .filter(line => line.trim().length > 0);
    return messages[Math.floor(Math.random() * messages.length)];
  } catch {
    return '今天天气怎么样？';
  }
}

async function captureQwenRequest() {
  console.log('连接到 Chrome 调试浏览器...');
  
  const response = await fetch('http://127.0.0.1:9222/json/version');
  const versionInfo = await response.json();
  const wsUrl = versionInfo.webSocketDebuggerUrl;
  
  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0];
  
  let page = context.pages().find(p => p.url().includes('qwen.ai'));
  
  if (!page) {
    console.log('未找到 Qwen 页面，创建新页面...');
    page = await context.newPage();
    await page.goto('https://chat.qwen.ai/', { waitUntil: 'networkidle' });
  }
  
  console.log('找到 Qwen 页面:', page.url());
  console.log('\n开始监听网络请求...\n');
  
  const capturedRequests = [];
  
  // 启用网络监听
  await page.route('**/*', route => {
    const request = route.request();
    const url = request.url();
    
    if (url.includes('qwen.ai') || url.includes('aliyun')) {
      capturedRequests.push({
        url,
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
      });
      
      console.log('\n=== 捕获请求 ===');
      console.log('URL:', url);
      console.log('Method:', request.method());
      console.log('Headers:', JSON.stringify(request.headers(), null, 2));
      if (request.postData()) {
        console.log('Body:', request.postData().substring(0, 500));
      }
    }
    
    route.continue();
  });
  
  // 模拟用户输入
  const testMessage = getRandomMessage();
  console.log('准备发送消息:', testMessage);
  console.log('\n尝试查找输入框并发送消息...\n');
  
  try {
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 查找输入框（尝试多种选择器）
    const selectors = [
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="问"]',
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
    ];
    
    let inputFound = false;
    for (const selector of selectors) {
      try {
        const input = await page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          console.log(`找到输入框: ${selector}`);
          await input.fill(testMessage);
          await page.keyboard.press('Enter');
          inputFound = true;
          console.log('消息已发送！');
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    
    if (!inputFound) {
      console.log('未找到输入框，请手动发送消息');
    }
    
    // 等待响应
    console.log('\n等待 API 响应...\n');
    await page.waitForTimeout(5000);
    
  } catch (e) {
    console.log('发送消息失败:', e.message);
    console.log('请手动在浏览器中发送消息');
    await page.waitForTimeout(10000);
  }
  
  console.log('\n=== 捕获到的所有请求 ===');
  console.log(JSON.stringify(capturedRequests, null, 2));
  
  await browser.close();
}

captureQwenRequest().catch(console.error);
