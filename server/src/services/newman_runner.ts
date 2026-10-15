import newman from 'newman';
import path from 'path';

export interface NewmanFailure {
  testName?: string;
  message: string;
  requestName: string;
  responseCode?: number;
}

export interface NewmanRunSummary {
  success: boolean;
  collectionName: string;
  totalRequests: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  responseTimeAvg: number;
  failures: NewmanFailure[];
  rawStats?: any;
}

export class NewmanService {
  /**
   * Executes a Postman collection programmatically and extracts a structured summary.
   */
  public async runCollection(
    collectionPathOrJson: string | object,
    environmentPathOrJson?: string | object,
    folder?: string
  ): Promise<NewmanRunSummary> {
    return new Promise((resolve, reject) => {
      const options: newman.NewmanRunOptions = {
        collection: collectionPathOrJson as any,
        reporters: ['cli'],
      };

      if (environmentPathOrJson) {
        options.environment = environmentPathOrJson as any;
      }
      if (folder) {
        options.folder = folder;
      }

      newman.run(options, (err, summary) => {
        if (err) {
          return resolve({
            success: false,
            collectionName: 'Error',
            totalRequests: 0,
            totalTests: 0,
            passedTests: 0,
            failedTests: 1,
            responseTimeAvg: 0,
            failures: [{ message: err.message, requestName: 'Setup' }],
          });
        }

        const run = summary.run;
        const stats: any = run.stats || {};
        const failures: NewmanFailure[] = (run.failures || []).map((f: any) => ({
          testName: f.error?.test || f.cursor?.ref,
          message: f.error?.message || 'Falha de asserção',
          requestName: f.source?.name || 'Desconhecido',
          responseCode: f.cursor?.httpResponseCode,
        }));

        const totalTests: number = stats.assertions?.total ?? 0;
        const failedTests: number = stats.assertions?.failed ?? 0;
        const passedTests: number = Math.max(0, totalTests - failedTests);
        const totalRequests: number = stats.requests?.total ?? 0;
        const responseTimeAvg: number = (run.timings as any)?.responseAverage ?? stats.responseAverage ?? 0;

        resolve({
          success: failedTests === 0,
          collectionName: summary.collection?.name || 'Postman Collection',
          totalRequests,
          totalTests,
          passedTests,
          failedTests,
          responseTimeAvg,
          failures,
          rawStats: stats,
        });
      });
    });
  }
}

export const newmanService = new NewmanService();
