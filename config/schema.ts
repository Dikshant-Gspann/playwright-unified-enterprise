// config/schema.ts
export interface FrameworkConfig {
    client: string;
    ciCd: {
      'azure-pipelines'?: boolean;
      'github-actions'?: boolean;
      circleci?: boolean;
    };
    webhooks: {
      slack?: { url: string };
      teams?: { url: string };
    };
    testManagement: {
      testrail?: {
        host: string;
        projectId: number;
        username: string;
      };
    };
    emailReporting: {
      enabled: boolean;
      smtp?: {
        host: string;
        port: number;
        user: string;
        pass: string;
      };
    };
  }
  