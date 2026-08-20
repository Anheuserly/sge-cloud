import { createApiKey } from './src/lib/platform-access';

async function main() {
  try {
    const result = await createApiKey({
      applicationId: '52718b6c-713e-47ef-a31a-a0839f79d737', // amcmep_android
      activeDatabaseKey: 'amcmep',
      name: 'Android Full Access Key',
      environment: 'production',
      scopes: ['all'],
      expiresAt: null
    });
    
    console.log('Successfully created API key!');
    console.log('KEY:', result.apiKey);
  } catch (error) {
    console.error('Failed to create key:', error);
  }
}

main();
