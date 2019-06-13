/**
 * Expose the TestCafe configuration file, so tests can access that information.
 */
import * as fs from "fs-extra";

// The TestCafe config file is required to be in the directory in which tests are run,
// so this location is safe to assume.
const testcafeConfigFilePath = ".testcaferc.json";

// This interface isn't built into TestCafe currently,
// so for now we'll need to tell Typescript what the config will look like.
// Only the values accessed in the tests need to be definied here.
interface TestCafeConfig {
  screenshotPath: string;
}

export const testcafeConfig: TestCafeConfig = JSON.parse(
  fs.readFileSync(testcafeConfigFilePath).toString()
);
