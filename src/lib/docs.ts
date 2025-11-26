import { readFile } from "fs/promises";
import { join } from "path";

const docsDirectory = join(process.cwd(), "docs");

export async function getDocContent(slug: string): Promise<string> {
  try {
    let filePath: string;

    if (slug === "" || slug === "index") {
      filePath = join(docsDirectory, "README.md");
    } else {
      filePath = join(docsDirectory, `${slug}.md`);
    }

    const content = await readFile(filePath, "utf-8");
    return content;
  } catch {
    throw new Error(`Failed to read doc: ${slug}`);
  }
}

export const docSlugs = [
  "gioi-thieu",
  "tong-quan",
  "setup",
  "database",
  "api",
  "huong-dan-su-dung",
  "tinh-nang-sap-ra-mat",
  "loi-cam-on",
];
