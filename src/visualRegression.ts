import * as fs from "fs-extra";
import * as path from "path";
// Only needed to ensure TestCafe type definitions are present.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _testcafe from "testcafe";

import { Screenshot } from "./Screenshot";
import { testcafeConfig } from "./testcafeConfig";

const defaultThreshold = 0.003;
const areaForSmallImage = 10000;
const thresholdForSmallImage = 0.005;
const areaForLargeImage = 800000;
const thresholdForLargeImage = 0.001;

const screenshotPath = testcafeConfig.screenshotPath;

/**
 * The threshold exists because two screenshots of an unchanged browser window
 * can possibly show a very small difference.
 * That difference is to be expected, but depending on the size of the screenshot,
 * those negligible differences will create a higher or lower diff percentage.
 *
 * To accomodate that, the threshold is determined
 * based on the size of the screenshot being taken.
 */
const getThreshold = (screenshotArea: number) => {
  if (screenshotArea < areaForSmallImage) {
    return thresholdForSmallImage;
  }

  if (screenshotArea > areaForLargeImage) {
    return thresholdForLargeImage;
  }

  return defaultThreshold;
};

interface VisualRegressionConfig {
  screenshotPathPrefix?: string;
}

export async function runVisualRegression(
  t: TestController,
  config: VisualRegressionConfig,
  name: string,
  selector?: Selector
) {
  const screenshotPathPrefix = config.screenshotPathPrefix || "";
  const baseScreenshotName = path.join(screenshotPathPrefix, `${name}.png`);
  const baseScreenshotFilePath = path.join(screenshotPath, baseScreenshotName);
  const testScreenshotName = path.join(screenshotPathPrefix, `${name}Test.png`);
  const testScreenshotFilePath = path.join(screenshotPath, testScreenshotName);

  const takeScreenshot = async (screenshotName: string): Promise<void> => {
    // TestCafe's screenshot taking methods
    // will automatically put the file in the screenshots dir from the config,
    // so just the file name can be passed in.
    if (selector) {
      await t.hover(selector);
      await t.takeElementScreenshot(selector, screenshotName);
    } else {
      await t.takeScreenshot(screenshotName);
    }
  };

  if (!fs.existsSync(baseScreenshotFilePath)) {
    await takeScreenshot(baseScreenshotName);
    throw new Error(
      `No base screenshot! Please confirm that the image at ${baseScreenshotFilePath} is as expected.
       Unless it is deleted, it will be used as the base acceptance image for this test.`
    );
  }

  await takeScreenshot(testScreenshotName);
  const baseScreenshot = Screenshot.fromPath(baseScreenshotFilePath);
  const testScreenshot = Screenshot.fromPath(testScreenshotFilePath);
  // Remove the test screenshot now that it is loaded into Screenshot
  fs.unlinkSync(testScreenshotFilePath);

  let error = "";
  if (!baseScreenshot.isSameSize(testScreenshot)) {
    error = "The screenshots are different sizes";
  } else {
    let threshold = getThreshold(baseScreenshot.area);
    const diff = baseScreenshot.percentDiff(testScreenshot);

    if (diff > threshold) {
      error = "The screenshots have different content";
    }
  }

  if (error) {
    // Overwrite the current base screenshot
    testScreenshot.saveToPath(baseScreenshotFilePath);
    throw new Error(
      `Screenshot for ${baseScreenshotFilePath} was changed: ${error}!
       This file has been overwritten with the initial assumption that this change is correct and expected.
       If this change is incorrect or unexpected, run 'git checkout ${baseScreenshotFilePath}' to remove the changes,
       fix the issue, then run these tests again.`
    );
  }
}

export class VisualRegression {
  public testController: TestController;
  public config: VisualRegressionConfig;

  public constructor(t: TestController, config: VisualRegressionConfig) {
    this.testController = t;
    this.config = config;
  }

  public run = async (name: string, selector?: Selector) => {
    await runVisualRegression(this.testController, this.config, name, selector);
  };
}
