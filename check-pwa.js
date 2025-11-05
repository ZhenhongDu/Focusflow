#!/usr/bin/env node

/**
 * FocusFlow PWA 配置检查脚本
 * 运行: node check-pwa.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}
╔════════════════════════════════════════════╗
║   FocusFlow PWA 配置检查工具           ║
╚════════════════════════════════════════════╝
${RESET}`);

let passed = 0;
let failed = 0;
let warnings = 0;

function checkFile(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`${GREEN}✓${RESET} ${description}`);
        passed++;
        return true;
    } else {
        console.log(`${RED}✗${RESET} ${description} (${filePath} 不存在)`);
        failed++;
        return false;
    }
}

function checkOptionalFile(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`${GREEN}✓${RESET} ${description}`);
        passed++;
        return true;
    } else {
        console.log(`${YELLOW}!${RESET} ${description} (${filePath} 未生成 - 需要手动创建)`);
        warnings++;
        return false;
    }
}

console.log('\n📦 核心配置文件检查:\n');

checkFile('vite.config.ts', 'Vite配置文件');
checkFile('public/manifest.json', 'Web App Manifest');
checkFile('index.html', 'HTML入口文件');
checkFile('components/PWAInstallPrompt.tsx', 'PWA安装提示组件');

console.log('\n🎨 图标文件检查:\n');

checkFile('public/icon/focus_flow.ico', '原有favicon图标');
checkFile('public/icon/focusflow_icon_apple.png', '原有Apple图标');

console.log('\n需要生成的PWA图标（使用generate-icons.html生成）:\n');

checkOptionalFile('public/icon/pwa-64x64.png', 'PWA图标 64x64');
checkOptionalFile('public/icon/pwa-192x192.png', 'PWA图标 192x192');
checkOptionalFile('public/icon/pwa-512x512.png', 'PWA图标 512x512');
checkOptionalFile('public/icon/maskable-icon-512x512.png', 'Maskable图标 512x512');
checkOptionalFile('public/icon/apple-touch-icon-180x180.png', 'Apple Touch图标 180x180');

console.log('\n📄 文档文件检查:\n');

checkFile('PWA_README.md', 'PWA使用说明');
checkFile('PWA_SETUP_GUIDE.md', 'PWA设置指南');
checkFile('PWA_TEST_GUIDE.md', 'PWA测试指南');
checkFile('PWA_IMPLEMENTATION_SUMMARY.md', 'PWA实现总结');
checkFile('PWA_CHECKLIST.md', 'PWA检查清单');

console.log('\n🛠️ 工具文件检查:\n');

checkFile('public/generate-icons.html', '图标生成工具');

console.log('\n📊 package.json依赖检查:\n');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasVitePWA = packageJson.devDependencies && packageJson.devDependencies['vite-plugin-pwa'];
    
    if (hasVitePWA) {
        console.log(`${GREEN}✓${RESET} vite-plugin-pwa 已安装 (${hasVitePWA})`);
        passed++;
    } else {
        console.log(`${RED}✗${RESET} vite-plugin-pwa 未安装`);
        console.log(`  运行: npm install -D vite-plugin-pwa`);
        failed++;
    }
}

console.log(`\n${'='.repeat(50)}\n`);

console.log(`${BLUE}检查结果:${RESET}`);
console.log(`${GREEN}✓ 通过: ${passed}${RESET}`);
console.log(`${YELLOW}! 警告: ${warnings}${RESET} (需要手动生成图标)`);
console.log(`${RED}✗ 失败: ${failed}${RESET}`);

console.log(`\n${'='.repeat(50)}\n`);

if (warnings > 0) {
    console.log(`${YELLOW}⚠️  下一步操作:${RESET}\n`);
    console.log('1. 启动开发服务器:');
    console.log(`   ${BLUE}npm run dev${RESET}\n`);
    console.log('2. 在浏览器中访问图标生成工具:');
    console.log(`   ${BLUE}http://localhost:3000/generate-icons.html${RESET}\n`);
    console.log('3. 点击"生成所有图标"按钮\n');
    console.log('4. 下载所有图标到 public/icon/ 目录\n');
    console.log('5. 再次运行本脚本验证: node check-pwa.js\n');
}

if (failed === 0 && warnings === 0) {
    console.log(`${GREEN}🎉 恭喜！所有PWA配置文件都已就绪！${RESET}\n`);
    console.log('下一步:');
    console.log(`1. 构建应用: ${BLUE}npm run build${RESET}`);
    console.log(`2. 预览应用: ${BLUE}npm run preview${RESET}`);
    console.log(`3. 在iPhone上测试安装\n`);
} else if (failed === 0 && warnings > 0) {
    console.log(`${YELLOW}✓ 核心配置已完成，但需要生成图标文件${RESET}\n`);
    console.log('图标生成后即可测试PWA功能！\n');
} else {
    console.log(`${RED}❌ 发现 ${failed} 个必需文件缺失${RESET}\n`);
    console.log('请检查上述失败项并修复。\n');
}

console.log(`详细指南请查看: ${BLUE}PWA_SETUP_GUIDE.md${RESET}\n`);
