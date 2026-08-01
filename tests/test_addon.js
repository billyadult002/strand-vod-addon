const { manifest, handleCatalog, handleStream } = require('../src/addon');
const { vodSources } = require('../src/maccms');
const top50Hub = require('../data/streamingsiteshub_top50.json');

async function runTests() {
  console.log('=== Strand VOD & Top50 Addon Test Suite ===');

  // Test 1: Check VOD sources count
  console.log(`[Test 1] Loaded VOD Sources: ${vodSources.length}, Top 50 Hub Sites: ${top50Hub.length}`);
  if (vodSources.length !== 301 || top50Hub.length !== 50) {
    throw new Error('Data validation failed');
  }
  console.log('✔ Test 1 Passed: 301 VOD sources & 50 StreamingSitesHub sites loaded.');

  // Test 2: Verify Manifest
  console.log(`[Test 2] Addon Name: ${manifest.name}`);
  if (!manifest.id || manifest.resources.length !== 3) {
    throw new Error('Manifest validation failed');
  }
  console.log('✔ Test 2 Passed: Stremio Manifest protocol structure is correct.');

  // Test 3: Top 50 Hub Catalog Query
  console.log('[Test 3] Testing catalog handler for hub_top50...');
  const hubCatalog = await handleCatalog('movie', 'hub_top50');
  console.log(`Top 50 catalog item count: ${hubCatalog.metas.length}`);
  if (hubCatalog.metas.length !== 50) {
    throw new Error('Hub catalog validation failed');
  }
  console.log(`  Sample Hub Item: [${hubCatalog.metas[0].name}] -> ${hubCatalog.metas[0].websiteUrl}`);
  console.log('✔ Test 3 Passed: StreamingSitesHub Top 50 catalog working.');

  // Test 4: Top 50 Stream Handler
  console.log('[Test 4] Testing stream handler for hub:1...');
  const hubStream = await handleStream('movie', 'hub:1');
  if (!hubStream.streams || hubStream.streams.length === 0) {
    throw new Error('Hub stream validation failed');
  }
  console.log(`  Sample Hub Stream: [${hubStream.streams[0].title}] -> ${hubStream.streams[0].externalUrl}`);
  console.log('✔ Test 4 Passed: Top 50 Stream handler working.');

  console.log('\nAll tests finished successfully!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
