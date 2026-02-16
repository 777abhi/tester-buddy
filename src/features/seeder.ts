import { request } from 'playwright';
import { BuddyConfig } from '../config';

export class Seeder {
  constructor(private config: BuddyConfig) {}

  async seedData(count: number) {
    const seedConfig = this.config.seeding;

    if (!seedConfig) {
      console.warn('No seeding configuration found. Using mock implementation.');
      console.log(`Mock: Seeding ${count} items...`);
      console.log('Mock: Data seeded successfully.');
      return;
    }

    console.log(`Seeding data to ${seedConfig.url}...`);
    const apiContext = await request.newContext();

    try {
      const response = await apiContext.fetch(seedConfig.url, {
        method: seedConfig.method || 'POST',
        headers: seedConfig.headers,
        data: { count }
      });

      if (response.ok()) {
        console.log(`Data seeded successfully. Status: ${response.status()}`);
      } else {
        console.error(`Failed to seed data. Status: ${response.status()} ${response.statusText()}`);
        console.error(await response.text());
      }
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      await apiContext.dispose();
    }
  }
}
