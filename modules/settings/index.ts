import { settingsServiceUnified, settingsService, settingsServiceClient } from './services/settings-service-unified';
import { Settings } from './models/setting';

// Export unified service and legacy compatibility exports
export { settingsServiceUnified, settingsService, settingsServiceClient };
export type { Settings }; 