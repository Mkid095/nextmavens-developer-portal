import { apiClient, ApiError } from '../lib/api-client';

export async function whoami(): Promise<void> {
  try {
    if (!apiClient.isAuthenticated()) {
      console.log('\n✗ You are not logged in.');
      console.log('Use "nextmavens login" to authenticate.\n');
      process.exit(1);
    }

    const developer = await apiClient.whoami();

    console.log('\nAuthenticated User:');
    console.log('-------------------');
    console.log(`Name:         ${developer.name}`);
    console.log(`Email:        ${developer.email}`);
    console.log(`Developer ID: ${developer.id}`);

    if (developer.organization) {
      console.log(`Organization: ${developer.organization}`);
    }

    if (developer.created_at) {
      const createdAt = new Date(developer.created_at);
      console.log(`Member Since: ${createdAt.toLocaleDateString()}`);
    }

    console.log('');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.log('Your session may have expired. Use "nextmavens login" to authenticate again.');
      }
    } else {
      console.error('\n✗ Failed to get user info:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
