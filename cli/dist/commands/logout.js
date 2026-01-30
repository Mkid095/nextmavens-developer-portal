import { apiClient } from '../lib/api-client';
import { config } from '../lib/config';

export async function logout(): Promise<void> {
  try {
    if (!apiClient.isAuthenticated()) {
      console.log('\n✓ You are already logged out.\n');
      return;
    }

    await apiClient.logout();

    console.log('\n✓ Logout successful!');
    console.log('Your authentication token has been removed.\n');
  } catch (error) {
    console.error('\n✗ Logout failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
