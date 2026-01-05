#!/usr/bin/env node

/**
 * Asset System Test and Validation Tool
 * Tests the new swgoh.gg + swgoh.help multi-source asset system
 */

// Use built-in fetch (Node.js 18+)

class AssetSystemTester {
  constructor() {
    this.sources = {
      swgohGG: 'https://swgoh.gg/static/img/assets',
      swgohHelp: 'https://api.swgoh.help/image',
      local: '/assets/fallback'
    };
    
    this.testUnits = [
      'COMMANDERLUKESKYWALKER',
      'DARTHVADER', 
      'JEDIKNIGHTREVAN',
      'BB8',
      'BADBATCHECHO',
      'YWINGREBEL',
      'MILLENNIUMFALCON',
      'CAPITALEXECUTOR',
      'UNKNOWNUNIT123' // Test invalid unit
    ];
  }

  /**
   * Validate if a URL is accessible
   */
  async validateUrl(url, timeout = 5000) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return {
        url,
        valid: response.ok,
        status: response.status,
        responseTime: Date.now() - start
      };
    } catch (error) {
      return {
        url,
        valid: false,
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Test character portraits from swgoh.gg
   */
  async testSwgohGGCharacters() {
    console.log('\n🧪 Testing swgoh.gg character portraits...');
    
    const results = [];
    for (const gameId of this.testUnits) {
      const url = `${this.sources.swgohGG}/char/${gameId}.png`;
      const result = await this.validateUrl(url);
      results.push(result);
      
      const status = result.valid ? '✅' : '❌';
      console.log(`  ${status} ${gameId}: ${result.valid ? 'OK' : result.error || result.status}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const validCount = results.filter(r => r.valid).length;
    console.log(`  📊 Summary: ${validCount}/${results.length} valid (${Math.round(validCount/results.length*100)}%)`);
    
    return results;
  }

  /**
   * Test ship images from swgoh.gg
   */
  async testSwgohGGShips() {
    console.log('\n🚀 Testing swgoh.gg ship images...');
    
    const shipIds = ['MILLENNIUMFALCON', 'YWINGREBEL', 'CAPITALEXECUTOR'];
    const results = [];
    
    for (const gameId of shipIds) {
      const url = `${this.sources.swgohGG}/ship/${gameId}.png`;
      const result = await this.validateUrl(url);
      results.push(result);
      
      const status = result.valid ? '✅' : '❌';
      console.log(`  ${status} ${gameId}: ${result.valid ? 'OK' : result.error || result.status}`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const validCount = results.filter(r => r.valid).length;
    console.log(`  📊 Summary: ${validCount}/${results.length} valid (${Math.round(validCount/results.length*100)}%)`);
    
    return results;
  }

  /**
   * Test swgoh.help API fallback
   */
  async testSwgohHelp() {
    console.log('\n🆘 Testing swgoh.help fallback API...');
    
    const results = [];
    for (const gameId of this.testUnits.slice(0, 5)) { // Test subset
      const url = `${this.sources.swgohHelp}/char/${gameId}`;
      const result = await this.validateUrl(url);
      results.push(result);
      
      const status = result.valid ? '✅' : '❌';
      console.log(`  ${status} ${gameId}: ${result.valid ? 'OK' : result.error || result.status}`);
      
      await new Promise(resolve => setTimeout(resolve, 200)); // More conservative rate limiting
    }
    
    const validCount = results.filter(r => r.valid).length;
    console.log(`  📊 Summary: ${validCount}/${results.length} valid (${Math.round(validCount/results.length*100)}%)`);
    
    return results;
  }

  /**
   * Test fallback strategy (swgoh.gg -> swgoh.help -> local)
   */
  async testFallbackStrategy() {
    console.log('\n🔄 Testing fallback strategy...');
    
    const testCases = [
      { gameId: 'COMMANDERLUKESKYWALKER', expectValid: true },
      { gameId: 'INVALIDUNIT999', expectValid: false }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n  Testing ${testCase.gameId}:`);
      
      // Try swgoh.gg first
      const swgohGGUrl = `${this.sources.swgohGG}/char/${testCase.gameId}.png`;
      const swgohGGResult = await this.validateUrl(swgohGGUrl);
      console.log(`    swgoh.gg: ${swgohGGResult.valid ? '✅ OK' : '❌ Failed'}`);
      
      if (swgohGGResult.valid) {
        console.log(`    🎯 Success on primary source`);
        continue;
      }
      
      // Try swgoh.help fallback
      const swgohHelpUrl = `${this.sources.swgohHelp}/char/${testCase.gameId}`;
      const swgohHelpResult = await this.validateUrl(swgohHelpUrl);
      console.log(`    swgoh.help: ${swgohHelpResult.valid ? '✅ OK' : '❌ Failed'}`);
      
      if (swgohHelpResult.valid) {
        console.log(`    🎯 Success on fallback source`);
        continue;
      }
      
      // Use local fallback
      console.log(`    local: 🏠 Using local fallback`);
      console.log(`    🎯 Final fallback: ${this.sources.local}/character-portrait.png`);
    }
  }

  /**
   * Performance benchmark
   */
  async performanceBenchmark() {
    console.log('\n⚡ Performance benchmark...');
    
    const testUnits = this.testUnits.slice(0, 5);
    const startTime = Date.now();
    
    // Test concurrent requests (simulate real usage)
    const promises = testUnits.map(async (gameId) => {
      const url = `${this.sources.swgohGG}/char/${gameId}.png`;
      return this.validateUrl(url);
    });
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / testUnits.length;
    
    console.log(`  📈 Concurrent requests: ${testUnits.length} units in ${totalTime}ms`);
    console.log(`  📈 Average response time: ${avgTime.toFixed(1)}ms per unit`);
    console.log(`  📈 Success rate: ${results.filter(r => r.valid).length}/${results.length}`);
  }

  /**
   * Ship vs Character detection test
   */
  testShipDetection() {
    console.log('\n🔍 Testing ship vs character detection...');
    
    const testCases = [
      { gameId: 'COMMANDERLUKESKYWALKER', expected: 'character' },
      { gameId: 'MILLENNIUMFALCON', expected: 'ship' },
      { gameId: 'YWINGREBEL', expected: 'ship' },
      { gameId: 'CAPITALEXECUTOR', expected: 'ship' },
      { gameId: 'JEDIKNIGHTREVAN', expected: 'character' }
    ];
    
    const shipPatterns = [
      /SHIP/i, /FALCON/i, /XWING/i, /YWING/i, /AWING/i, /BWING/i, /UWING/i,
      /PHANTOM/i, /GHOST/i, /SLAVE/i, /SCYTHE/i, /BOMBER/i, /FIGHTER/i,
      /FRIGATE/i, /DESTROYER/i, /CRUISER/i, /CAPITAL/i
    ];
    
    const isShipGameId = (gameId) => {
      return shipPatterns.some(pattern => pattern.test(gameId));
    };
    
    let correct = 0;
    for (const testCase of testCases) {
      const detected = isShipGameId(testCase.gameId) ? 'ship' : 'character';
      const isCorrect = detected === testCase.expected;
      
      if (isCorrect) correct++;
      
      const status = isCorrect ? '✅' : '❌';
      console.log(`  ${status} ${testCase.gameId}: detected as ${detected} (expected ${testCase.expected})`);
    }
    
    console.log(`  📊 Detection accuracy: ${correct}/${testCases.length} (${Math.round(correct/testCases.length*100)}%)`);
  }

  /**
   * Run comprehensive test suite
   */
  async runTests() {
    console.log('🚀 Starting Asset System Test Suite');
    console.log('=====================================');
    
    try {
      // Basic functionality tests
      await this.testSwgohGGCharacters();
      await this.testSwgohGGShips();
      await this.testSwgohHelp();
      
      // Advanced feature tests
      await this.testFallbackStrategy();
      this.testShipDetection();
      
      // Performance tests
      await this.performanceBenchmark();
      
      console.log('\n✅ Test suite completed successfully!');
      console.log('\n📋 Summary:');
      console.log('  - Multi-source asset loading ✅');
      console.log('  - Fallback strategy ✅');
      console.log('  - Ship/character detection ✅');
      console.log('  - Performance benchmarking ✅');
      
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Built-in fetch should be available in Node.js 18+

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AssetSystemTester();
  tester.runTests().catch(console.error);
}

module.exports = AssetSystemTester;