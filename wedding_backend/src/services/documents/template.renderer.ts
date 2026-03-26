import { promises as fs } from "fs";
import ejs from "ejs";

export async function renderTemplate(templatePath: string, data: unknown): Promise<string> {
  const templateSource = await fs.readFile(templatePath, "utf8");

  return ejs.render(templateSource, data as ejs.Data, {
    async: false,
    filename: templatePath,
  });
}
