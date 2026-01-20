import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

interface ProjectOptions {
  name: string;
  title: string;
  description: string;
  author: string;
  template: string;
}

const program = new Command();

program
  .name('@jet-w/astro-blog-cli')
  .description('CLI tool for creating Astro blogs with @jet-w/astro-blog theme')
  .version('0.1.0');

program
  .command('create [project-name]')
  .description('Create a new Astro blog project')
  .option('-t, --template <template>', 'Template to use', 'default')
  .option('--title <title>', 'Blog title')
  .option('--description <description>', 'Blog description')
  .option('--author <author>', 'Author name')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (projectName: string | undefined, options: any) => {
    console.log(chalk.cyan('\n🚀 @jet-w/astro-blog CLI\n'));

    let config: ProjectOptions;

    if (options.yes && projectName) {
      config = {
        name: projectName,
        title: options.title || 'My Astro Blog',
        description: options.description || '基于 Astro + Vue + Tailwind 构建的个人技术博客',
        author: options.author || 'Author',
        template: options.template || 'default'
      };
    } else {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '项目名称:',
          default: projectName || 'my-astro-blog',
          validate: (input: string) => {
            if (/^[a-z0-9-_]+$/.test(input)) {
              return true;
            }
            return '项目名称只能包含小写字母、数字、横线和下划线';
          }
        },
        {
          type: 'input',
          name: 'title',
          message: '博客标题:',
          default: options.title || 'My Astro Blog'
        },
        {
          type: 'input',
          name: 'description',
          message: '博客描述:',
          default: options.description || '基于 Astro + Vue + Tailwind 构建的个人技术博客'
        },
        {
          type: 'input',
          name: 'author',
          message: '作者名称:',
          default: options.author || 'Author'
        },
        {
          type: 'list',
          name: 'template',
          message: '选择模板:',
          choices: [
            { name: 'default - 完整功能模板', value: 'default' }
          ],
          default: 'default'
        }
      ]);
      config = answers;
    }

    const targetDir = path.resolve(process.cwd(), config.name);

    // Check if directory exists
    if (fs.existsSync(targetDir)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `目录 ${config.name} 已存在，是否覆盖?`,
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('\n已取消创建项目'));
        process.exit(0);
      }

      await fs.remove(targetDir);
    }

    const spinner = ora('正在创建项目...').start();

    try {
      // Find template directory
      // Templates are bundled with the CLI package for reliable access
      let templateDir: string | null = null;

      // Priority 1: CLI package's own templates directory (bundled)
      const cliTemplatePaths = [
        path.join(__dirname, '..', 'templates', config.template),  // dist/../templates
        path.join(__dirname, 'templates', config.template),        // dist/templates (if bundled differently)
      ];

      for (const p of cliTemplatePaths) {
        if (fs.existsSync(p)) {
          templateDir = p;
          break;
        }
      }

      // Priority 2: Try to resolve from @jet-w/astro-blog package (for development or when both installed)
      if (!templateDir) {
        try {
          const corePkgPath = require.resolve('@jet-w/astro-blog/package.json', {
            paths: [process.cwd(), __dirname]
          });
          const corePkgDir = path.dirname(corePkgPath);
          const templatePath = path.join(corePkgDir, 'templates', config.template);
          if (fs.existsSync(templatePath)) {
            templateDir = templatePath;
          }
        } catch {
          // Package not installed, continue to fallback
        }
      }

      // Priority 3: Development environment (monorepo)
      if (!templateDir) {
        const devPaths = [
          path.join(__dirname, '..', '..', '@jet-w.astro-blog', 'templates', config.template),
          path.join(__dirname, '..', '..', '..', '@jet-w.astro-blog', 'templates', config.template),
          path.join(__dirname, '..', '..', '@jet-w.astro-blog-cli', 'templates', config.template),
        ];
        for (const p of devPaths) {
          if (fs.existsSync(p)) {
            templateDir = p;
            break;
          }
        }
      }

      if (!templateDir) {
        throw new Error(`模板 "${config.template}" 不存在。可用路径已检查:\n${cliTemplatePaths.join('\n')}`);
      }

      // Copy template
      await fs.copy(templateDir, targetDir);

      // Update package.json
      const pkgPath = path.join(targetDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = await fs.readJson(pkgPath);
        pkg.name = config.name;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      }

      // Update site config
      const configPath = path.join(targetDir, 'src', 'config', 'index.ts');
      if (fs.existsSync(configPath)) {
        let configContent = await fs.readFile(configPath, 'utf-8');
        configContent = configContent
          .replace(/title: ['"].*['"]/, `title: '${config.title}'`)
          .replace(/description: ['"].*['"]/, `description: '${config.description}'`)
          .replace(/author: ['"].*['"]/, `author: '${config.author}'`);
        await fs.writeFile(configPath, configContent);
      }

      spinner.succeed(chalk.green('项目创建成功!'));

      console.log(chalk.cyan(`
下一步:
  ${chalk.yellow(`cd ${config.name}`)}
  ${chalk.yellow('npm install')}
  ${chalk.yellow('npm run dev')}

文档:
  https://github.com/jet-w/astro-blog

祝你写作愉快! 🎉
`));

    } catch (error) {
      spinner.fail(chalk.red('项目创建失败'));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize an existing project with @jet-w/astro-blog')
  .action(async () => {
    console.log(chalk.cyan('\n🚀 初始化 @jet-w/astro-blog\n'));

    const spinner = ora('正在检查项目...').start();

    const pkgPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
      spinner.fail(chalk.red('未找到 package.json，请在项目根目录运行此命令'));
      process.exit(1);
    }

    try {
      const pkg = await fs.readJson(pkgPath);

      // Add dependencies
      if (!pkg.dependencies) {
        pkg.dependencies = {};
      }
      pkg.dependencies['@jet-w/astro-blog'] = '^0.1.0';

      await fs.writeJson(pkgPath, pkg, { spaces: 2 });

      spinner.succeed(chalk.green('初始化成功!'));
      console.log(chalk.cyan(`
请运行以下命令安装依赖:
  ${chalk.yellow('npm install')}
`));

    } catch (error) {
      spinner.fail(chalk.red('初始化失败'));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
