#!/usr/bin/env node

;(async () => {
  // Load ESM-only Inquirer
  const inquirer = (await import('inquirer')).default;
  const { writeJSON, ensureDirSync } = require('fs-extra');

  try {
    // 1. Prompt the user
    const answers = await inquirer.prompt([
      { name: 'client', message: 'Client name:', type: 'input' },
      {
        name: 'ciCd',
        message: 'Select CI/CD systems:',
        type: 'checkbox',
        choices: [
          { name: 'Azure Pipelines', value: 'azure-pipelines' },
          { name: 'GitHub Actions', value: 'github-actions' },
          { name: 'CircleCI', value: 'circleci' },
        ],
      },
      { name: 'slack', message: 'Slack webhook URL (leave blank to skip):', type: 'input' },
      { name: 'teams', message: 'Teams webhook URL (leave blank to skip):', type: 'input' },
      { name: 'useTR', message: 'Use TestRail?', type: 'confirm', default: false },
      {
        name: 'trHost',
        message: 'TestRail host:',
        type: 'input',
        when: (ans) => ans.useTR,
      },
      {
        name: 'trPid',
        message: 'TestRail project ID:',
        type: 'number',
        when: (ans) => ans.useTR,
      },
      { name: 'emailRpt', message: 'Enable email reporting?', type: 'confirm', default: false },
      {
        name: 'smtpHost',
        message: 'SMTP host:',
        type: 'input',
        when: (ans) => ans.emailRpt,
      },
      {
        name: 'smtpPort',
        message: 'SMTP port:',
        type: 'number',
        when: (ans) => ans.emailRpt,
      },
      {
        name: 'smtpUser',
        message: 'SMTP user:',
        type: 'input',
        when: (ans) => ans.emailRpt,
      },
      {
        name: 'smtpPass',
        message: 'SMTP password:',
        type: 'password',
        when: (ans) => ans.emailRpt,
      },
    ]);

    // 2. Assemble config object
    const cfg = {
      client: answers.client,
      ciCd: Object.fromEntries(answers.ciCd.map((k) => [k, true])),
      webhooks: {
        ...(answers.slack ? { slack: { url: answers.slack } } : {}),
        ...(answers.teams ? { teams: { url: answers.teams } } : {}),
      },
      testManagement: answers.useTR
        ? { testrail: { host: answers.trHost, projectId: answers.trPid, username: '' } }
        : {},
      emailReporting: {
        enabled: answers.emailRpt,
        ...(answers.emailRpt
          ? { smtp: { host: answers.smtpHost, port: answers.smtpPort, user: answers.smtpUser, pass: answers.smtpPass } }
          : {}),
      },
    };

    // 3. Ensure output directory and write file
    ensureDirSync('configs');
    const outPath = `configs/${cfg.client}.json`;
    await writeJSON(outPath, cfg, { spaces: 2 });
    console.log(`✅ Wrote config to ${outPath}`);
  } catch (err) {
    console.error('❌ Error generating config:', err);
    process.exit(1);
  }
})();
