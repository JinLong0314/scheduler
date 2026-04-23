import { cancel, intro, isCancel, outro, select } from '@clack/prompts';
import pc from 'picocolors';
import { initCommand } from './commands/init.js';
import { deployCommand } from './commands/deploy.js';

async function main(): Promise<void> {
  intro(pc.bgYellow(pc.black(' Kairo CLI ')));
  const args = process.argv.slice(2);
  let cmd = args[0];
  if (!cmd) {
    const picked = await select({
      message: '选择操作',
      options: [
        { value: 'init', label: '初始化 Cloudflare 资源（D1 / R2 / KV）' },
        { value: 'deploy', label: '部署（Worker + Web + 可选 Desktop/Mobile）' },
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
    case 'deploy':
      await deployCommand(args.slice(1));
      break;
    default:
      console.error(pc.red(`未知命令: ${cmd}`));
      console.info('可用: init | deploy');
      process.exit(1);
  }
  outro(pc.green('完成 ✨'));
}

main().catch((e) => {
  console.error(pc.red(String(e instanceof Error ? e.message : e)));
  process.exit(1);
});
