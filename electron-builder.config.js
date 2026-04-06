const packageJson = require('./package.json');

function normalizeTrimmed(value) {
  return String(value || '').trim();
}

const outputDir = normalizeTrimmed(process.env.ELECTRON_BUILDER_OUTPUT) || packageJson.build?.directories?.output || 'dist-electron';
const githubOwner = normalizeTrimmed(process.env.GH_OWNER);
const githubRepo = normalizeTrimmed(process.env.GH_REPO);
const isGitHubPublishEnabled = Boolean(githubOwner && githubRepo);

module.exports = {
  ...packageJson.build,
  directories: {
    ...(packageJson.build?.directories || {}),
    output: outputDir,
  },
  publish: isGitHubPublishEnabled
    ? [
        {
          provider: 'github',
          owner: githubOwner,
          repo: githubRepo,
        },
      ]
    : undefined,
};
