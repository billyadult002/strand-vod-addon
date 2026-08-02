const assert = require('assert');
const { manifest, handleCatalog } = require('../src/addon');
const { vodSources } = require('../src/maccms');
const top50Hub = require('../src/data_top50.json');

console.log("🧪 Testing Addon Manifest and Endpoints...");

// Test manifest
assert.strictEqual(manifest.id, 'com.billyadult002.strand.vod.top50');
assert.strictEqual(manifest.version, '2.1.0');
assert.strictEqual(manifest.name, "Billy's VOD & Top50 影视聚合 (Strand Addon)");
assert.ok(manifest.catalogs.length >= 3);

// Test VOD sources
assert.strictEqual(vodSources.length, 301, 'VOD sources should be deduplicated to 301');

// Test Top 50 Hub
assert.strictEqual(top50Hub.length, 50, 'StreamingSitesHub Top 50 should have 50 items');

// Test Catalog handler
(async () => {
  const result = await handleCatalog('movie', 'billy_hub_top50');
  assert.ok(result.metas.length === 50, 'Top50 catalog should return 50 metas');
  console.log("✅ Top 50 Catalog test passed! First rank:", result.metas[0].name);

  const playlistHandler = require('../api/playlist');
  let body = '';
  const mockRes = {
    setHeader: () => {},
    status: () => mockRes,
    send: (content) => { body = content; }
  };
  playlistHandler({}, mockRes);
  assert.ok(body.includes('#EXTM3U'), 'Playlist should start with #EXTM3U');
  assert.ok(body.includes('中文VOD影视源'), 'Playlist should include VOD sources');
  console.log("✅ M3U & M3U8 Playlist handler test passed!");
  console.log("🎉 ALL TESTS PASSED!");
})();
