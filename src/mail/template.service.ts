import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

@Injectable()
export class TemplateService implements OnModuleInit {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesDir = path.join(process.cwd(), 'src/mail/templates');
  private cache = new Map<string, Handlebars.TemplateDelegate>();

  async onModuleInit() {
    const files = await fs.readdir(this.templatesDir);
    await Promise.all(files.filter((f) => f.endsWith('.hbs')).map((f) => this.loadTemplate(path.basename(f, '.hbs'))));
    this.logger.log(`Loaded ${this.cache.size} email templates`);
  }

  async getTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    if (!this.cache.has(templateName)) {
      await this.loadTemplate(templateName);
    }
    return this.cache.get(templateName)!(context);
  }

  private async loadTemplate(templateName: string): Promise<void> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    this.cache.set(templateName, Handlebars.compile(templateContent));
  }
}
