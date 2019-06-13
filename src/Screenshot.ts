import * as fs from "fs-extra";
import * as path from "path";

import { PNG } from "pngjs";

export class Screenshot {
  /*
   * Load a screenshot from a path.
   */
  public static fromPath(filePath: string): Screenshot {
    return new Screenshot(fs.readFileSync(filePath));
  }

  public png: PNG;

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(source: Buffer | PNG) {
    this.png = source instanceof Buffer ? PNG.sync.read(source) : source;
  }

  public get area(): number {
    return this.png.width * this.png.height;
  }

  /**
   * Determine if the current screenshot is the same size as another screenshot.
   */
  public isSameSize(compareShot: Screenshot): boolean {
    const sameWidth = compareShot.png.width === this.png.width;
    const sameHeight = compareShot.png.height === this.png.height;
    return sameWidth && sameHeight;
  }

  /**
   * Compute the difference of the current screenshot with another screenshot by percentage of pixels.
   */
  public percentDiff(diffShot: Screenshot): number {
    let pixelDiff = 0;
    const bufferLength = this.png.data.length;

    // Default to 100% diff if images are not the same size.
    if (!this.isSameSize(diffShot)) {
      return 1;
    }

    for (let x = 0; x < bufferLength; x++) {
      if (this.png.data[x] !== diffShot.png.data[x]) {
        pixelDiff++;
      }
    }

    return pixelDiff / (this.png.width * this.png.height);
  }

  /**
   * Save a screenshot to a path.
   */
  public saveToPath(filePath: string): void {
    const basePath = filePath.slice(
      0,
      filePath.lastIndexOf(path.basename(filePath))
    );
    fs.mkdirpSync(basePath);
    fs.writeFileSync(filePath, PNG.sync.write(this.png));
  }
}
