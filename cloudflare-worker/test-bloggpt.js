#!/usr/bin/env node

/**
 * BlogGPT Test Suite and Demonstration
 * Shows the revolutionary capabilities of the AI-powered blog ecosystem
 */

const chalk = require('chalk');
const axios = require('axios');

// Configuration
const WORKER_URL = process.env.BLOGGPT_URL || 'https://bloggpt-ai-ecosystem.your-subdomain.workers.dev';
const DEMO_REQUESTS = [
  {
    name: "Blog Post Creation",
    message: "Write a comprehensive blog post about the revolutionary BlogGPT system and how it uses CloudFlare Workers AI",
    expectedActions: ["create_post"],
    description: "Tests end-to-end blog post creation with AI research, content generation, and GitHub publishing"
  },
  {
    name: "Topic Research",
    message: "What are the latest trends in CloudFlare Workers and edge computing?",
    expectedActions: ["research_topic"],
    description: "Tests AI-powered research capabilities and trend analysis"
  },
  {
    name: "Content Management",
    message: "Show me my recent blog posts",
    expectedActions: ["list_posts"],
    description: "Tests content listing and metadata retrieval"
  },
  {
    name: "General Chat",
    message: "Hello BlogGPT! How can you help me with my technical blog?",
    expectedActions: ["chat"],
    description: "Tests natural language conversation capabilities"
  },
  {
    name: "Technical Deep Dive",
    message: "Create a technical blog post explaining how to optimize AWS Lambda functions for cold start performance",
    expectedActions: ["create_post"],
    description: "Tests technical content generation with code examples and best practices"
  }
];

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  step: (msg) => console.log(chalk.cyan('🔹'), msg),
  header: (msg) => console.log(chalk.bold.magenta('\n' + msg + '\n' + '='.repeat(msg.length)))
};

// Test functions
async function testSystemStatus() {
  log.header('🔍 System Status Check');
  
  try {
    const response = await axios.get(`${WORKER_URL}/api/status`, { timeout: 10000 });
    
    if (response.status === 200 && response.data.status === 'operational') {
      log.success('BlogGPT is operational');
      log.info(`Version: ${response.data.version}`);
      log.info(`Features: ${response.data.features.length} available`);
      log.info(`Recent posts: ${response.data.recentPosts}`);
      
      console.log('\nAvailable Features:');
      response.data.features.forEach(feature => {
        log.step(feature);
      });
      
      return true;
    } else {
      log.error('BlogGPT is not operational');
      return false;
    }
  } catch (error) {
    log.error(`Failed to connect to BlogGPT: ${error.message}`);
    log.warning('Make sure the worker is deployed and accessible');
    return false;
  }
}

async function testChatInterface(request) {
  log.header(`💬 Testing: ${request.name}`);
  log.info(`Description: ${request.description}`);
  log.step(`Message: "${request.message}"`);
  
  try {
    const startTime = Date.now();
    
    log.info('Sending request to BlogGPT...');
    const response = await axios.post(`${WORKER_URL}/api/chat`, {
      message: request.message
    }, { 
      timeout: 120000, // 2 minutes for complex operations
      headers: { 'Content-Type': 'application/json' }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200 && response.data.success) {
      log.success(`Request completed in ${duration}ms`);
      
      // Display response details
      const data = response.data;
      
      if (data.type === 'chat') {
        log.step('Response type: General chat');
        console.log(chalk.gray('Response:'), data.response);
      }
      
      if (data.steps) {
        log.step('Processing steps:');
        data.steps.forEach(step => console.log(chalk.gray('  •'), step));
      }
      
      if (data.post) {
        log.step('Blog post created:');
        console.log(chalk.gray('  Title:'), data.post.title);
        console.log(chalk.gray('  Slug:'), data.post.slug);
        console.log(chalk.gray('  URL:'), data.post.url);
        console.log(chalk.gray('  SEO Score:'), data.post.seoScore);
        console.log(chalk.gray('  Read Time:'), data.post.estimatedReadTime, 'minutes');
        console.log(chalk.gray('  Status:'), data.post.publishStatus);
      }
      
      if (data.posts) {
        log.step(`Found ${data.posts.length} recent posts`);
        data.posts.slice(0, 3).forEach(post => {
          console.log(chalk.gray('  •'), post.title, chalk.dim(`(${post.readTime}min)`));
        });
      }
      
      return { success: true, duration, data };
    } else {
      log.error('Request failed');
      console.log('Response:', response.data);
      return { success: false, duration, error: response.data };
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

async function runPerformanceTest() {
  log.header('⚡ Performance Test');
  
  const simpleRequests = [
    'Hello BlogGPT!',
    'What can you do?',
    'Show me my posts',
    'Help me with content ideas'
  ];
  
  log.info('Testing response times for simple requests...');
  
  const results = [];
  for (const message of simpleRequests) {
    try {
      const startTime = Date.now();
      const response = await axios.post(`${WORKER_URL}/api/chat`, { message }, { timeout: 30000 });
      const endTime = Date.now();
      
      results.push({
        message,
        duration: endTime - startTime,
        success: response.status === 200
      });
      
      log.step(`"${message}": ${endTime - startTime}ms`);
    } catch (error) {
      results.push({
        message,
        duration: -1,
        success: false,
        error: error.message
      });
      log.warning(`"${message}": Failed (${error.message})`);
    }
  }
  
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    log.success(`Average response time: ${Math.round(avgTime)}ms`);
    log.info(`Success rate: ${successful.length}/${results.length} (${Math.round(successful.length/results.length*100)}%)`);
  }
  
  return results;
}

async function demonstrateFeatures() {
  log.header('🚀 BlogGPT Feature Demonstration');
  
  console.log(chalk.bold('BlogGPT showcases the following revolutionary capabilities:\n'));
  
  const features = [
    {
      emoji: '🗣️',
      name: 'Natural Language Interface',
      description: 'Communicate with your blog using everyday language',
      example: '"Write a post about Kubernetes security best practices"'
    },
    {
      emoji: '🧠',
      name: 'AI-Powered Research',
      description: 'Automatic topic research and trend analysis',
      example: '"What are the latest AWS features announced this month?"'
    },
    {
      emoji: '📝',
      name: 'Intelligent Content Generation',
      description: 'Creates comprehensive, SEO-optimized blog posts',
      example: 'Generates 2000+ word technical articles with code examples'
    },
    {
      emoji: '🎨',
      name: 'Cover Image Creation',
      description: 'AI-generated professional cover images using FLUX',
      example: 'Creates stunning visuals that match your content'
    },
    {
      emoji: '📊',
      name: 'SEO Optimization',
      description: 'Automatic meta descriptions, keywords, and optimization',
      example: 'Achieves 90+ SEO scores with optimized content structure'
    },
    {
      emoji: '🔗',
      name: 'GitHub Integration',
      description: 'Direct publishing to your Hugo blog repository',
      example: 'Commits properly formatted posts with Hugo front matter'
    },
    {
      emoji: '⚡',
      name: 'Edge Performance',
      description: 'Global edge computing for minimal latency',
      example: 'Sub-second response times from 180+ global locations'
    },
    {
      emoji: '🔄',
      name: 'Style Consistency',
      description: 'Analyzes existing content to maintain your writing style',
      example: 'Matches tone, structure, and technical depth automatically'
    }
  ];
  
  features.forEach(feature => {
    console.log(`${feature.emoji} ${chalk.bold(feature.name)}`);
    console.log(chalk.gray(`   ${feature.description}`));
    console.log(chalk.dim(`   Example: ${feature.example}`));
    console.log();
  });
}

async function showUsageExamples() {
  log.header('💡 Usage Examples');
  
  const examples = [
    {
      category: 'Content Creation',
      examples: [
        'Write a blog post about the latest Docker features',
        'Create a tutorial on setting up Kubernetes monitoring',
        'Generate an article about AWS cost optimization strategies'
      ]
    },
    {
      category: 'Research & Analysis',
      examples: [
        'What are the current trends in microservices architecture?',
        'Research the latest security vulnerabilities in container orchestration',
        'Analyze the performance benefits of edge computing'
      ]
    },
    {
      category: 'Content Management',
      examples: [
        'Show me my most popular blog posts',
        'Update my Terraform article with 2025 best practices',
        'Create a series about CloudFlare Workers development'
      ]
    },
    {
      category: 'SEO & Optimization',
      examples: [
        'Optimize my AWS Lambda post for better search rankings',
        'Generate meta descriptions for my recent articles',
        'Suggest keywords for a post about DevOps automation'
      ]
    }
  ];
  
  examples.forEach(category => {
    console.log(chalk.bold(`${category.category}:`));
    category.examples.forEach(example => {
      console.log(chalk.gray(`  • "${example}"`));
    });
    console.log();
  });
}

// Main test execution
async function main() {
  console.log(chalk.rainbow('🤖 BlogGPT AI Ecosystem Test Suite & Demonstration\n'));
  
  // Check if URL is provided
  if (WORKER_URL.includes('your-subdomain')) {
    log.warning('Please set BLOGGPT_URL environment variable to your worker URL');
    log.info('Example: export BLOGGPT_URL=https://bloggpt-ai-ecosystem.your-subdomain.workers.dev');
    process.exit(1);
  }
  
  // Feature demonstration
  await demonstrateFeatures();
  await showUsageExamples();
  
  // System status check
  const isOnline = await testSystemStatus();
  if (!isOnline) {
    log.error('BlogGPT is not accessible. Please check deployment.');
    process.exit(1);
  }
  
  // Performance testing
  await runPerformanceTest();
  
  // Feature testing
  log.header('🧪 Running Feature Tests');
  
  const results = [];
  for (const request of DEMO_REQUESTS) {
    const result = await testChatInterface(request);
    results.push({ ...request, ...result });
    
    // Wait between requests to avoid rate limiting
    if (DEMO_REQUESTS.indexOf(request) < DEMO_REQUESTS.length - 1) {
      log.info('Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  log.header('📊 Test Summary');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log.info(`Total tests: ${results.length}`);
  log.success(`Successful: ${successful.length}`);
  if (failed.length > 0) {
    log.error(`Failed: ${failed.length}`);
    failed.forEach(test => {
      log.step(`Failed: ${test.name} - ${test.error}`);
    });
  }
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + (r.duration || 0), 0) / successful.length;
    log.info(`Average response time: ${Math.round(avgDuration)}ms`);
  }
  
  const successRate = (successful.length / results.length) * 100;
  if (successRate >= 80) {
    log.success(`BlogGPT is performing excellently! (${Math.round(successRate)}% success rate)`);
  } else if (successRate >= 60) {
    log.warning(`BlogGPT is performing adequately (${Math.round(successRate)}% success rate)`);
  } else {
    log.error(`BlogGPT needs attention (${Math.round(successRate)}% success rate)`);
  }
  
  console.log(chalk.bold.green('\n🎉 BlogGPT testing completed!\n'));
  console.log('Ready to revolutionize your blog creation process with AI! 🚀');
}

// Handle CLI execution
if (require.main === module) {
  main().catch(error => {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testSystemStatus, testChatInterface, runPerformanceTest };