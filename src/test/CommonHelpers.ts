import { MessageController } from './MessageController';
import config from './config.json';

/**
 * Settings and steps which are shared by test files of unrelated features, so that neither a
 * test file nor a feature helper such as CatalogHelpers has to read config.json or carry a copy
 * of its own.
 */

export const TEST_SERVER_URL: string = config.serverURL0;
export const CATALOG_LARGE_SUBDIRECTORY: string = config.path.catalogLarge;
export const CATALOG_ARTIFICIAL_SUBDIRECTORY: string = config.path.catalogArtificial;
export const CONNECTION_TIMEOUT: number = config.timeout.connection;
export const OPEN_FILE_TIMEOUT: number = config.timeout.openFile;
export const READ_FILE_TIMEOUT: number = config.timeout.readFile;
export const OPEN_CATALOG_LARGE_TIMEOUT: number = config.timeout.openCatalogLarge;

/**
 * Resolve "$BASE" and prepend it to the directory of every request given. The requests are
 * modified in place, so a file which registers more than one describe block has to pass each
 * of them once only.
 */
export function basePath(requests: { directory?: string }[]) {
    test(`Get basepath and modify the directory path`, async () => {
        const fileListResponse = await MessageController.Instance.getFileList('$BASE', 0);
        const basepath = fileListResponse.directory;
        requests.forEach((request) => {
            request.directory = basepath + '/' + request.directory;
        });
    });
}
