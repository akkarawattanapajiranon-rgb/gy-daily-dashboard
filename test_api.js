import { fetchWasteData, fetchCmsData } from './src/services/api.js';

async function test() {
  console.log('Testing...');
  try {
    const [w, c] = await Promise.all([
      fetchWasteData(),
      fetchCmsData()
    ]);
    console.log('Waste:', w ? 'Success' : 'Fail');
    console.log('CMS:', c ? 'Success' : 'Fail');
  } catch (err) {
    console.error('Promise.all error:', err);
  }
}
test();
