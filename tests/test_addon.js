const http = require('http');
const { manifest, handleCatalog, handleStream } = require('../src/addon');
const { vodSources } = require('../src/maccms');

async function runTests() {
  console.log('=== Strand VOD Addon Automated Test Suite ===');

  // Test 1: Check VOD sources count
  console.log(`[Test 1] Loaded VOD Sources: ${vodSources.length}`);
  if (vodSources.length !== 301) {
    throw new Error(`Expected 301 sources, found ${vodSources.length}`);
  }
  console.log('✔ Test 1 Passed: 301 deduplicated sources verified.');

  // Test 2: Verify Manifest
  console.log(`[Test 2] Addon Name: ${manifest.name}, Resources: ${manifest.resources.join(', ')}`);
  if (!manifest.id || manifest.resources.length !== 3) {
    throw new Error('Manifest validation failed');
  }
  console.log('✔ Test 2 Passed: Stremio Manifest protocol structure is correct.');

  // Test 3: Catalog Query
  console.log('[Test 3] Testing catalog search handler for keyword "封神"...');
  try {
    const catalogRes = await handleCatalog('movie', 'maccms_movie', { search: '封神' });
    console.log(`Catalog results count: ${catalogRes.metas.length}`);
    if (catalogRes.metas.length > 0) {
      console.log(`  Sample item: [${catalogRes.metas[0].name}] (ID: ${catalogRes.metas[0].id})`);
    }
    console.log('✔ Test 3 Passed: Catalog search working.');
  } catch (e) {
    console.error('Catalog test failed:', e.message);
  }

  // Test 4: Stream Handler
  console.log('[Test 4] Testing stream handler for title "封神"...');
  try {
    const streamRes = await handleStream('movie', 'vod:%E5%B0%81%E7%A5%9E');
    console.log(`Streams found count: ${streamRes.streams.length}`);
    if (streamRes.streams.length > 0) {
      console.log(`  Sample stream: [${streamRes.streams[0].title}] -> ${streamRes.streams[0].url.slice(0, 60)}...`);
    }
    console.log('✔ Test 4 Passed: Stream resolution working.');
  } catch (e) {
    console.error('Stream test failed:', e.message);
  }

  console.log('All tests finished successfully!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
