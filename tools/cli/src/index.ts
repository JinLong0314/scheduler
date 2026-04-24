import { cancel, intro, isCancel, outro, select } from '@clack/prompts';
import pc from 'picocolors';
import { initCommand } from './commands/init.js';
import { deployCommand } from './commands/deploy.js';
import { releaseCommand, mobileUploadCommand } from './commands/release.js';

async function main(): Promise<void> {
  intro(pc.bgYellow(pc.black(' Kairo CLI ')));
  const args = process.argv.slice(2);
  let cmd = args[0];
  if (!cmd) {
    const picked = await select({
      message: '选择操作',
      options: [
        { value: 'init', label: '初始化 Cloudflare 资源（D1 / R2 / KV）' },
        { value: 'release', label: '发布全流程（构建 + R2 上传 + Worker/Pages 部署）' },
        { value: 'deploy', label: '仅部署（Worker / Web）' },
        { value: 'mobile-upload', label: '下载最新 APK 并上传到 R2' },
      ],
    });
    if (isCancel(picked)) {
      cancel('已取消');
      process.exit(0);
    }
    cmd = String(picked);
  }

  switch (cmd) {
    case 'init':
      await initCommand();
      break;
    case 'release':
      await releaseCommand(args.slice(1));
      break;
    case 'deploy':
      await deployCommand(args.slice(1));
      break;
    case 'mobile-upload':
      await mobileUploadCommand(args.slice(1));
      break;
    default:
      console.error(pc.red(`未知命令: ${cmd}`));
      console.info('可用: init | release | deploy | mobile-upload');
      process.exit(1);
  }
  outro(pc.green('完成 ✨'));
}

main().catch((e) => {
  console.error(pc.red(String(e instanceof Error ? e.message : e)));
  process.exit(1);
});
