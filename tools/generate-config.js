#!/usr/bin/env node
'use strict';

;(async () => {
  // Inquirer is ESM-only
  const inquirer = (await import('inquirer')).default;
  const { writeJSON, ensureDirSync } = require('fs-extra');

  try {
    const answers = await inquirer.prompt([
      { name: 'client', message: 'Client name:', type: 'input', validate: v => !!v || 'Required' },

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

      // ---- Teams
      { name: 'useTeams', message: 'Use Teams notifications?', type: 'confirm', default: true },
      {
        name: 'teamsMode',
        message: 'Teams config:',
        type: 'list',
        choices: ['Use env secret placeholder', 'Paste URL now'],
        when: a => a.useTeams,
        default: 'Use env secret placeholder'
      },
      {
        name: 'teamsUrl',
        message: 'Teams webhook URL:',
        type: 'input',
        when: a => a.useTeams && a.teamsMode === 'Paste URL now'
      },

      // ---- Slack
      { name: 'useSlack', message: 'Use Slack notifications?', type: 'confirm', default: false },
      {
        name: 'slackMode',
        message: 'Slack config:',
        type: 'list',
        choices: ['Use env secret placeholder', 'Paste URL now'],
        when: a => a.useSlack,
        default: 'Use env secret placeholder'
      },
      {
        name: 'slackUrl',
        message: 'Slack webhook URL:',
        type: 'input',
        when: a => a.useSlack && a.slackMode === 'Paste URL now'
      },

      // ---- TestRail
      { name: 'useTR', message: 'Use TestRail?', type: 'confirm', default: false },
      {
        name: 'trMode',
        message: 'TestRail config:',
        type: 'list',
        choices: ['Use env secret placeholders', 'Enter values now'],
        when: a => a.useTR,
        default: 'Use env secret placeholders'
      },
      { name: 'trHost', message: 'TestRail host:', type: 'input', when: a => a.useTR && a.trMode === 'Enter values now' },
      { name: 'trPid',  message: 'TestRail project ID:', type: 'number', when: a => a.useTR && a.trMode === 'Enter values now' },
      { name: 'trUser', message: 'TestRail username:', type: 'input', when: a => a.useTR && a.trMode === 'Enter values now' },

      // ---- Email (SMTP)
      { name: 'emailRpt', message: 'Enable email reporting?', type: 'confirm', default: false },
      {
        name: 'smtpMode',
        message: 'SMTP config:',
        type: 'list',
        choices: ['Use env secret placeholders', 'Enter values now'],
        when: a => a.emailRpt,
        default: 'Use env secret placeholders'
      },
      { name: 'smtpHost', message: 'SMTP host:', type: 'input',  when: a => a.emailRpt && a.smtpMode === 'Enter values now' },
      { name: 'smtpPort', message: 'SMTP port:', type: 'number', when: a => a.emailRpt && a.smtpMode === 'Enter values now' },
      { name: 'smtpUser', message: 'SMTP user:', type: 'input',  when: a => a.emailRpt && a.smtpMode === 'Enter values now' },
      { name: 'smtpPass', message: 'SMTP password:', type: 'password', when: a => a.emailRpt && a.smtpMode === 'Enter values now' },
    ]);

    // Build webhooks object
    const webhooks = {};
    if (answers.useTeams) {
      webhooks.teams = {
        url: answers.teamsMode === 'Use env secret placeholder'
          ? '${TEAMS_WEBHOOK_URL}'
          : answers.teamsUrl || ''
      };
    }
    if (answers.useSlack) {
      webhooks.slack = {
        url: answers.slackMode === 'Use env secret placeholder'
          ? '${SLACK_WEBHOOK_URL}'
          : answers.slackUrl || ''
      };
    }

    // Test management
    const testManagement = {};
    if (answers.useTR) {
      testManagement.testrail =
        answers.trMode === 'Use env secret placeholders'
          ? {
              host: '${TESTRAIL_HOST}',
              projectId: '${TESTRAIL_PROJECT_ID}',
              username: '${TESTRAIL_USERNAME}'
            }
          : {
              host: answers.trHost || '',
              projectId: Number(answers.trPid || 0),
              username: answers.trUser || ''
            };
    }

    // Email reporting
    const emailReporting = { enabled: !!answers.emailRpt };
    if (answers.emailRpt) {
      emailReporting.smtp =
        answers.smtpMode === 'Use env secret placeholders'
          ? { host: '${SMTP_HOST}', port: 587, user: '${SMTP_USER}', pass: '${SMTP_PASS}' }
          : { host: answers.smtpHost || '', port: Number(answers.smtpPort || 0), user: answers.smtpUser || '', pass: answers.smtpPass || '' };
    }

    const cfg = {
      client: answers.client,
      ciCd: Object.fromEntries((answers.ciCd || []).map(k => [k, true])),
      webhooks,
      testManagement,
      emailReporting
    };

    ensureDirSync('configs');
    const outPath = `configs/${cfg.client}.json`;
    await writeJSON(outPath, cfg, { spaces: 2 });
    console.log(`✅ Wrote config to ${outPath}`);
    console.log('ℹ️  Remember to add the corresponding secrets in your CI (e.g., TEAMS_WEBHOOK_URL, SLACK_WEBHOOK_URL, SMTP_*, TESTRAIL_*).');
  } catch (err) {
    console.error('❌ Error generating config:', err);
    process.exit(1);
  }
})();
