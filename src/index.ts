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

// Get version from package.json
const pkgJson = require('../package.json');
const VERSION = pkgJson.version;

interface ProjectOptions {
  name: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  author: string;
  email: string;
  site: string;
  template: string;
  lang: 'en' | 'zh';
}

// i18n messages
const messages = {
  en: {
    welcome: '🚀 @jet-w/astro-blog CLI',
    projectName: 'Project name:',
    projectNameValidation: 'Project name can only contain lowercase letters, numbers, hyphens and underscores',
    blogTitle: 'Blog title (English):',
    blogTitleZh: 'Blog title (Chinese):',
    blogDescription: 'Blog description (English):',
    blogDescriptionZh: 'Blog description (Chinese):',
    authorName: 'Author name:',
    authorEmail: 'Author email:',
    siteUrl: 'Site URL:',
    selectTemplate: 'Select template:',
    templateDefault: 'default - Full-featured template',
    dirExists: 'Directory {name} already exists. Overwrite?',
    cancelled: 'Project creation cancelled',
    creating: 'Creating project...',
    success: 'Project created successfully!',
    failed: 'Project creation failed',
    nextSteps: `
Next steps:
  {cd}
  {install}
  {dev}

Documentation:
  https://github.com/jet-w/astro-blog

Happy writing! 🎉
`,
    initWelcome: '🚀 Initialize @jet-w/astro-blog',
    checking: 'Checking project...',
    noPkgJson: 'No package.json found. Please run this command in a project root directory',
    initSuccess: 'Initialization successful!',
    initFailed: 'Initialization failed',
    runInstall: `
Please run the following command to install dependencies:
  {install}
`,
  },
  zh: {
    welcome: '🚀 @jet-w/astro-blog CLI',
    projectName: '项目名称:',
    projectNameValidation: '项目名称只能包含小写字母、数字、横线和下划线',
    blogTitle: '博客标题 (英文):',
    blogTitleZh: '博客标题 (中文):',
    blogDescription: '博客描述 (英文):',
    blogDescriptionZh: '博客描述 (中文):',
    authorName: '作者名称:',
    authorEmail: '作者邮箱:',
    siteUrl: '站点地址:',
    selectTemplate: '选择模板:',
    templateDefault: 'default - 完整功能模板',
    dirExists: '目录 {name} 已存在，是否覆盖?',
    cancelled: '已取消创建项目',
    creating: '正在创建项目...',
    success: '项目创建成功!',
    failed: '项目创建失败',
    nextSteps: `
下一步:
  {cd}
  {install}
  {dev}

文档:
  https://github.com/jet-w/astro-blog

祝你写作愉快! 🎉
`,
    initWelcome: '🚀 初始化 @jet-w/astro-blog',
    checking: '正在检查项目...',
    noPkgJson: '未找到 package.json，请在项目根目录运行此命令',
    initSuccess: '初始化成功!',
    initFailed: '初始化失败',
    runInstall: `
请运行以下命令安装依赖:
  {install}
`,
  }
};

type Lang = keyof typeof messages;

function getMessages(lang: Lang) {
  return messages[lang] || messages.en;
}

function detectSystemLanguage(): Lang {
  const locale = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || '';
  if (locale.toLowerCase().includes('zh')) {
    return 'zh';
  }
  return 'en';
}

async function findTemplateDir(templateName: string): Promise<string> {
  // Priority 1: CLI package's own templates directory (bundled)
  const cliTemplatePaths = [
    path.join(__dirname, '..', 'templates', templateName),
    path.join(__dirname, 'templates', templateName),
  ];

  for (const p of cliTemplatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Priority 2: Try to resolve from @jet-w/astro-blog package
  try {
    const corePkgPath = require.resolve('@jet-w/astro-blog/package.json', {
      paths: [process.cwd(), __dirname]
    });
    const corePkgDir = path.dirname(corePkgPath);
    const templatePath = path.join(corePkgDir, 'templates', templateName);
    if (fs.existsSync(templatePath)) {
      return templatePath;
    }
  } catch {
    // Package not installed, continue to fallback
  }

  // Priority 3: Development environment (monorepo)
  const devPaths = [
    path.join(__dirname, '..', '..', '@jet-w.astro-blog', 'templates', templateName),
    path.join(__dirname, '..', '..', '..', '@jet-w.astro-blog', 'templates', templateName),
    path.join(__dirname, '..', '..', '@jet-w.astro-blog-cli', 'templates', templateName),
  ];

  for (const p of devPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(`Template "${templateName}" not found. Checked paths:\n${cliTemplatePaths.join('\n')}`);
}

async function updateProjectFiles(targetDir: string, config: ProjectOptions) {
  // Update package.json
  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    pkg.name = config.name;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  // Update main site config (src/config/site.ts)
  const siteConfigPath = path.join(targetDir, 'src', 'config', 'site.ts');
  if (fs.existsSync(siteConfigPath)) {
    let content = await fs.readFile(siteConfigPath, 'utf-8');
    content = content
      .replace(/title: ['"][^'"]*['"]/, `title: '${config.title}'`)
      .replace(/description: ['"][^'"]*['"]/, `description: '${config.description}'`)
      .replace(/author: ['"][^'"]*['"]/, `author: '${config.author}'`)
      .replace(/email: ['"][^'"]*['"]/, `email: '${config.email}'`);
    await fs.writeFile(siteConfigPath, content);
  }

  // Update English locale config
  const enSitePath = path.join(targetDir, 'src', 'config', 'locales', 'en', 'site.ts');
  if (fs.existsSync(enSitePath)) {
    let content = await fs.readFile(enSitePath, 'utf-8');
    content = content
      .replace(/title: ['"][^'"]*['"]/, `title: '${config.title}'`)
      .replace(/description: ['"][^'"]*['"]/, `description: '${config.description}'`);
    await fs.writeFile(enSitePath, content);
  }

  // Update Chinese locale config
  const zhSitePath = path.join(targetDir, 'src', 'config', 'locales', 'zh-CN', 'site.ts');
  if (fs.existsSync(zhSitePath)) {
    let content = await fs.readFile(zhSitePath, 'utf-8');
    content = content
      .replace(/title: ['"][^'"]*['"]/, `title: '${config.titleZh}'`)
      .replace(/description: ['"][^'"]*['"]/, `description: '${config.descriptionZh}'`);
    await fs.writeFile(zhSitePath, content);
  }

  // Update astro.config.mjs site URL
  const astroConfigPath = path.join(targetDir, 'astro.config.mjs');
  if (fs.existsSync(astroConfigPath) && config.site) {
    let content = await fs.readFile(astroConfigPath, 'utf-8');
    content = content.replace(/site: ['"][^'"]*['"]/, `site: '${config.site}'`);
    await fs.writeFile(astroConfigPath, content);
  }
}

const program = new Command();

program
  .name('astro-blog')
  .description('CLI tool for creating Astro blogs with @jet-w/astro-blog theme')
  .version(VERSION);

// Main create command - also the default action
program
  .command('create [project-name]', { isDefault: true })
  .description('Create a new Astro blog project')
  .option('-t, --template <template>', 'Template to use', 'default')
  .option('--title <title>', 'Blog title (English)')
  .option('--title-zh <titleZh>', 'Blog title (Chinese)')
  .option('--description <description>', 'Blog description (English)')
  .option('--description-zh <descriptionZh>', 'Blog description (Chinese)')
  .option('--author <author>', 'Author name')
  .option('--email <email>', 'Author email')
  .option('--site <site>', 'Site URL (e.g., https://example.com)')
  .option('--lang <lang>', 'CLI language (en/zh)', detectSystemLanguage())
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-f, --force', 'Overwrite existing directory without confirmation')
  .action(async (projectName: string | undefined, options: any) => {
    const lang: Lang = options.lang === 'zh' ? 'zh' : 'en';
    const msg = getMessages(lang);

    console.log(chalk.cyan(`\n${msg.welcome}\n`));

    let config: ProjectOptions;

    // Non-interactive mode: use command line options
    if (options.yes && projectName) {
      config = {
        name: projectName,
        title: options.title || 'My Astro Blog',
        titleZh: options.titleZh || '我的Astro博客',
        description: options.description || '',
        descriptionZh: options.descriptionZh || '',
        author: options.author || 'Author',
        email: options.email || 'email@example.com',
        site: options.site || 'https://example.com',
        template: options.template || 'default',
        lang
      };
    } else {
      // Interactive mode: prompt for missing values
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: msg.projectName,
          default: projectName || 'my-astro-blog',
          validate: (input: string) => {
            if (/^[a-z0-9-_]+$/.test(input)) {
              return true;
            }
            return msg.projectNameValidation;
          }
        },
        {
          type: 'input',
          name: 'title',
          message: msg.blogTitle,
          default: options.title || 'My Astro Blog'
        },
        {
          type: 'input',
          name: 'titleZh',
          message: msg.blogTitleZh,
          default: options.titleZh || '我的Astro博客'
        },
        {
          type: 'input',
          name: 'description',
          message: msg.blogDescription,
          default: options.description || ''
        },
        {
          type: 'input',
          name: 'descriptionZh',
          message: msg.blogDescriptionZh,
          default: options.descriptionZh || ''
        },
        {
          type: 'input',
          name: 'author',
          message: msg.authorName,
          default: options.author || 'Author'
        },
        {
          type: 'input',
          name: 'email',
          message: msg.authorEmail,
          default: options.email || 'email@example.com'
        },
        {
          type: 'input',
          name: 'site',
          message: msg.siteUrl,
          default: options.site || 'https://example.com'
        },
        {
          type: 'list',
          name: 'template',
          message: msg.selectTemplate,
          choices: [
            { name: msg.templateDefault, value: 'default' }
          ],
          default: 'default'
        }
      ]);

      config = { ...answers, lang };
    }

    const targetDir = path.resolve(process.cwd(), config.name);

    // Check if directory exists
    if (fs.existsSync(targetDir)) {
      if (!options.force) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: msg.dirExists.replace('{name}', config.name),
            default: false
          }
        ]);

        if (!overwrite) {
          console.log(chalk.yellow(`\n${msg.cancelled}`));
          process.exit(0);
        }
      }

      await fs.remove(targetDir);
    }

    const spinner = ora(msg.creating).start();

    try {
      // Find and copy template
      const templateDir = await findTemplateDir(config.template);
      await fs.copy(templateDir, targetDir);

      // Update project files with user configuration
      await updateProjectFiles(targetDir, config);

      spinner.succeed(chalk.green(msg.success));

      const nextSteps = msg.nextSteps
        .replace('{cd}', chalk.yellow(`cd ${config.name}`))
        .replace('{install}', chalk.yellow('npm install'))
        .replace('{dev}', chalk.yellow('npm run dev'));

      console.log(chalk.cyan(nextSteps));

    } catch (error) {
      spinner.fail(chalk.red(msg.failed));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize an existing project with @jet-w/astro-blog')
  .option('--lang <lang>', 'CLI language (en/zh)', detectSystemLanguage())
  .action(async (options: any) => {
    const lang: Lang = options.lang === 'zh' ? 'zh' : 'en';
    const msg = getMessages(lang);

    console.log(chalk.cyan(`\n${msg.initWelcome}\n`));

    const spinner = ora(msg.checking).start();

    const pkgPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
      spinner.fail(chalk.red(msg.noPkgJson));
      process.exit(1);
    }

    try {
      const pkg = await fs.readJson(pkgPath);

      // Add dependencies
      if (!pkg.dependencies) {
        pkg.dependencies = {};
      }
      pkg.dependencies['@jet-w/astro-blog'] = `^${VERSION}`;

      await fs.writeJson(pkgPath, pkg, { spaces: 2 });

      spinner.succeed(chalk.green(msg.initSuccess));

      const installMsg = msg.runInstall.replace('{install}', chalk.yellow('npm install'));
      console.log(chalk.cyan(installMsg));

    } catch (error) {
      spinner.fail(chalk.red(msg.initFailed));
      console.error(error);
      process.exit(1);
    }
  });

// Parse arguments - handle both "astro-blog create" and "create-astro-blog" styles
const args = process.argv.slice(2);

// If invoked as "create-astro-blog" or with no command, treat first arg as project name
if (process.argv[1].includes('create-astro-blog') && args.length > 0 && !args[0].startsWith('-') && args[0] !== 'create' && args[0] !== 'init') {
  // Rewrite args to: create <project-name> [rest...]
  process.argv.splice(2, 0, 'create');
}

program.parse();
