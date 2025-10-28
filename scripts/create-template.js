#!/usr/bin/env node
/**
 * Bootstraps a fresh copy of the Coin Copilot app into a destination directory
 * with project-specific identifiers replaced by user-supplied values.
 *
 * This lets you reuse the private routing, authentication, and notification
 * stack without manually copying files each time.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function printUsage() {
  console.log(`
Usage: node scripts/create-template.js <destination-path> [options]

Options:
  --name <displayName>             Human readable app name (defaults to folder name)
  --slug <slug>                    URL/app slug (defaults to kebab-case name)
  --scheme <scheme>                Deep link scheme (defaults to slug)
  --bundle-id <identifier>         iOS bundle identifier (defaults to com.example.<slug>)
  --android-package <identifier>   Android package name (defaults to bundle id)
  --supabase-project-id <id>       Supabase project id for config.toml (defaults to slug)
  --overwrite                      Allow writing into a non-empty destination

Example:
  node scripts/create-template.js ../next-finance --name "Next Finance" --bundle-id com.example.nextfinance
`);
}

function parseArgs(argv) {
  const options = {
    positional: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith('--')) {
      options.positional.push(current);
      continue;
    }

    if (current === '--overwrite') {
      options.overwrite = true;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      console.error(`Missing value for ${current}`);
      process.exit(1);
    }

    switch (current) {
      case '--name':
        options.name = next;
        break;
      case '--slug':
        options.slug = next;
        break;
      case '--scheme':
        options.scheme = next;
        break;
      case '--bundle-id':
        options.bundleId = next;
        break;
      case '--android-package':
        options.androidPackage = next;
        break;
      case '--supabase-project-id':
        options.supabaseProjectId = next;
        break;
      default:
        console.error(`Unknown option ${current}`);
        process.exit(1);
    }
    i += 1;
  }

  return options;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toTitleCase(value) {
  return value
    .split(/[-_ ]+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function ensureDestination(destPath, overwrite) {
  if (fs.existsSync(destPath)) {
    const contents = fs.readdirSync(destPath);
    if (contents.length > 0 && !overwrite) {
      console.error(
        `Destination ${destPath} is not empty. Re-run with --overwrite if you want to continue.`
      );
      process.exit(1);
    }
  } else {
    fs.mkdirSync(destPath, { recursive: true });
  }
}

function copyItem(relPath, destRoot) {
  const source = path.join(ROOT, relPath);
  const target = path.join(destRoot, relPath);

  if (!fs.existsSync(source)) {
    console.warn(`Skipping missing path: ${relPath}`);
    return;
  }

  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.cpSync(source, target, {
      recursive: true,
      // Skip junk files that occasionally show up locally.
      filter: (srcPath) => {
        const basename = path.basename(srcPath);
        if (basename === '.DS_Store' || basename === 'node_modules') {
          return false;
        }
        return true;
      },
    });
  } else {
    const targetDir = path.dirname(target);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function writeJson(filePath, transform) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = transform(data);
  fs.writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
}

function replaceInFile(filePath, replacements) {
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  replacements.forEach((value, key) => {
    updated = updated.replaceAll(key, value);
  });

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

function createEnvTemplate(destRoot, projectSlug) {
  const content = `# Copy this file to .env.local and fill in with your Supabase project values
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
# Optional, used for local notes
# SUPABASE_DB_PASSWORD=
`;

  fs.writeFileSync(path.join(destRoot, '.env.template'), content, 'utf8');
  if (!fs.existsSync(path.join(destRoot, '.env.local'))) {
    fs.writeFileSync(
      path.join(destRoot, '.env.local'),
      '# This file intentionally left blank. Copy values from .env.template.\n',
      'utf8'
    );
  }
}

function applyDocsPlaceholders(destRoot) {
  const files = [
    'SETUP_CRON_JOB.md',
    'SETUP_CLEANUP_CRON_JOB.md',
    'PERFORMANCE_OPTIMIZATION_COMPLETE.md',
    'diagnose_notification_issue.sql',
    'test_catchup_notifications.sql',
    'test_cleanup_function.sql',
  ];

  files.forEach((file) => {
    const target = path.join(destRoot, file);
    if (!fs.existsSync(target)) {
      return;
    }

    replaceInFile(
      target,
      new Map([
        ['ftjovjfauzamebmzetfr', 'YOUR_SUPABASE_PROJECT_REF'],
        [
          'https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/',
          'https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/',
        ],
      ])
    );
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const [destination] = args.positional;

  if (!destination) {
    printUsage();
    process.exit(1);
  }

  const destRoot = path.resolve(process.cwd(), destination);

  const defaultName =
    args.name ||
    toTitleCase(path.basename(destRoot).replace(/[_-]/g, ' ')) ||
    'My App';
  const slug = args.slug || slugify(defaultName);
  const scheme = args.scheme || slug.replace(/[^a-z0-9]/g, '');
  const bundleId = args.bundleId || `com.example.${slug.replace(/-/g, '')}`;
  const androidPackage = args.androidPackage || bundleId;
  const supabaseProjectId = args.supabaseProjectId || slug;

  ensureDestination(destRoot, args.overwrite);

  const itemsToCopy = [
    '.gitignore',
    'app.json',
    'assets',
    'eas.json',
    'eslint.config.js',
    'expo-env.d.ts',
    'package.json',
    'package-lock.json',
    'src',
    'supabase',
    'NOTIFICATION_SYSTEM.md',
    'SUPABASE_SETUP.md',
    'PROJECT_DOCUMENTATION.md',
    'SETUP_CRON_JOB.md',
    'SETUP_CLEANUP_CRON_JOB.md',
    'PERFORMANCE_OPTIMIZATION_COMPLETE.md',
    'cleanup_orphaned_schedules.sql',
    'diagnose_notification_issue.sql',
    'test_catchup_notifications.sql',
    'test_cleanup_function.sql',
  ];

  itemsToCopy.forEach((item) => copyItem(item, destRoot));

  const packageJsonPath = path.join(destRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    writeJson(packageJsonPath, (pkg) => {
      return {
        ...pkg,
        name: slug,
      };
    });
  }

  const appJsonPath = path.join(destRoot, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    writeJson(appJsonPath, (config) => {
      const updated = { ...config };
      if (updated.expo) {
        updated.expo = {
          ...updated.expo,
          name: defaultName,
          slug,
          scheme,
          ios: {
            ...(updated.expo.ios || {}),
            bundleIdentifier: bundleId,
          },
          android: {
            ...(updated.expo.android || {}),
            package: androidPackage,
          },
          extra: {
            ...(updated.expo.extra || {}),
            eas: {
              ...(updated.expo.extra?.eas || {}),
              projectId: 'REPLACE_WITH_EAS_PROJECT_ID',
            },
          },
        };
      }
      return updated;
    });
  }

  const supabaseConfigPath = path.join(destRoot, 'supabase', 'config.toml');
  if (fs.existsSync(supabaseConfigPath)) {
    replaceInFile(
      supabaseConfigPath,
      new Map([[`project_id = "coin-copilot"`, `project_id = "${supabaseProjectId}"`]])
    );
  }

  createEnvTemplate(destRoot, slug);
  applyDocsPlaceholders(destRoot);

  console.log('Template created with the following values:');
  console.log(`  Destination: ${destRoot}`);
  console.log(`  Name:        ${defaultName}`);
  console.log(`  Slug:        ${slug}`);
  console.log(`  Scheme:      ${scheme}`);
  console.log(`  iOS Bundle:  ${bundleId}`);
  console.log(`  Android:     ${androidPackage}`);
  console.log(`  Supabase ID: ${supabaseProjectId}`);
  console.log('\nNext steps:');
  console.log('  1. Update .env.local with your Supabase credentials.');
  console.log('  2. Replace REPLACE_WITH_EAS_PROJECT_ID in app.json if you use EAS.');
  console.log('  3. Review documentation files for additional placeholders.');
}

main();

