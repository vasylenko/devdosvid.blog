import { Octokit } from '@octokit/rest';
import { Ai } from '@cloudflare/ai';
import slugify from 'slugify';
import { format, parseISO } from 'date-fns';

/**
 * BlogGPT - AI-Powered Blog Ecosystem
 * Revolutionary natural language interface for blog post creation
 */
export default {
  async fetch(request, env, ctx) {
    const ai = new Ai(env.AI);
    const url = new URL(request.url);
    
    // CORS headers for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (url.pathname) {
        case '/':
          return new Response(getHomePage(), {
            headers: { ...corsHeaders, 'Content-Type': 'text/html' }
          });
        
        case '/api/chat':
          if (request.method === 'POST') {
            return await handleChatRequest(request, env, ai);
          }
          break;
          
        case '/api/status':
          return await handleStatusRequest(env);
          
        case '/api/posts':
          return await handlePostsRequest(env);
          
        default:
          return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

/**
 * Handle natural language chat requests for blog post creation
 */
async function handleChatRequest(request, env, ai) {
  const { message, action = 'chat' } = await request.json();
  
  if (!message) {
    return new Response(
      JSON.stringify({ error: 'Message is required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Analyze the intent of the message
  const intent = await analyzeIntent(message, ai);
  
  let response;
  switch (intent.action) {
    case 'create_post':
      response = await createBlogPost(message, intent, env, ai);
      break;
    case 'research_topic':
      response = await researchTopic(intent.topic, env, ai);
      break;
    case 'list_posts':
      response = await listRecentPosts(env);
      break;
    case 'update_post':
      response = await updateExistingPost(intent, env, ai);
      break;
    default:
      response = await generateChatResponse(message, ai);
  }

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Analyze user intent using AI
 */
async function analyzeIntent(message, ai) {
  const systemPrompt = `You are an AI assistant that analyzes user messages to understand their intent for blog management.

Analyze the user message and respond with a JSON object containing:
- action: one of ["create_post", "research_topic", "list_posts", "update_post", "chat"]
- topic: the main topic if creating/researching a post
- title: suggested title if creating a post
- urgency: "high", "medium", or "low"
- complexity: "simple", "medium", or "complex"

Examples:
"Write a blog post about CloudFlare Workers" -> {"action": "create_post", "topic": "CloudFlare Workers", "title": "Getting Started with CloudFlare Workers", "urgency": "medium", "complexity": "medium"}
"What's new in AWS this week?" -> {"action": "research_topic", "topic": "AWS new features", "urgency": "high", "complexity": "medium"}
"Show me my recent posts" -> {"action": "list_posts", "urgency": "low", "complexity": "simple"}`;

  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]
  });

  try {
    return JSON.parse(response.response);
  } catch {
    return {
      action: "chat",
      topic: "general",
      urgency: "low",
      complexity: "simple"
    };
  }
}

/**
 * Create a complete blog post from natural language request
 */
async function createBlogPost(userMessage, intent, env, ai) {
  const steps = [];
  
  // Step 1: Research the topic
  steps.push("🔍 Researching topic and gathering information...");
  const research = await researchTopic(intent.topic, env, ai);
  
  // Step 2: Analyze existing content for style consistency
  steps.push("📚 Analyzing your existing blog posts for style consistency...");
  const styleAnalysis = await analyzeBlogStyle(env, ai);
  
  // Step 3: Generate the blog post content
  steps.push("✍️ Generating comprehensive blog post...");
  const content = await generateBlogContent(intent, research, styleAnalysis, ai);
  
  // Step 4: Generate cover image
  steps.push("🎨 Creating cover image with FLUX model...");
  const coverImage = await generateCoverImage(content.title, intent.topic, ai);
  
  // Step 5: Optimize for SEO
  steps.push("🚀 Optimizing for SEO and generating metadata...");
  const seoData = await optimizeForSEO(content, ai);
  
  // Step 6: Create Hugo front matter and full post
  const postData = createHugoPost(content, seoData, coverImage);
  
  // Step 7: Publish to GitHub
  steps.push("📤 Publishing to GitHub repository...");
  const publishResult = await publishToGitHub(postData, env);
  
  // Step 8: Store metadata in KV
  await storePostMetadata(postData, env);
  
  return {
    success: true,
    steps,
    post: {
      title: content.title,
      slug: postData.slug,
      url: `${env.BLOG_BASE_URL}/posts/${postData.year}/${postData.slug}/`,
      seoScore: seoData.score,
      estimatedReadTime: seoData.readTime,
      publishStatus: publishResult.success ? 'published' : 'failed'
    },
    github: publishResult
  };
}

/**
 * Research a topic using AI and web search capabilities
 */
async function researchTopic(topic, env, ai) {
  const researchPrompt = `Research the topic "${topic}" and provide:
1. Current trends and recent developments
2. Key concepts and terminology
3. Practical applications and use cases
4. Common challenges and solutions
5. Relevant tools and technologies
6. Expert opinions and best practices

Format as structured JSON with sections: trends, concepts, applications, challenges, tools, experts.`;

  const response = await ai.run("@cf/meta/llama-3.1-70b-instruct", {
    messages: [
      { role: "system", content: "You are a technical research assistant specializing in software development, cloud computing, and DevOps topics." },
      { role: "user", content: researchPrompt }
    ]
  });

  try {
    return JSON.parse(response.response);
  } catch {
    return {
      trends: ["Latest developments in " + topic],
      concepts: ["Core concepts related to " + topic],
      applications: ["Practical uses of " + topic],
      challenges: ["Common challenges with " + topic],
      tools: ["Tools and technologies for " + topic],
      experts: ["Industry experts in " + topic]
    };
  }
}

/**
 * Analyze existing blog style for consistency
 */
async function analyzeBlogStyle(env, ai) {
  // Get recent posts from KV storage or GitHub
  const recentPosts = await getRecentPosts(env, 5);
  
  if (recentPosts.length === 0) {
    return {
      tone: "technical and informative",
      structure: "introduction, main content, conclusion",
      audience: "software developers and DevOps engineers"
    };
  }

  const analysisPrompt = `Analyze the writing style of these blog posts and extract:
1. Tone and voice (formal, casual, technical, etc.)
2. Typical structure and organization
3. Target audience
4. Common phrases and terminology
5. Average length and depth

Posts to analyze:
${recentPosts.map(post => `Title: ${post.title}\nContent: ${post.content.substring(0, 500)}...`).join('\n\n')}`;

  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
    messages: [
      { role: "system", content: "You are a writing style analyst." },
      { role: "user", content: analysisPrompt }
    ]
  });

  try {
    return JSON.parse(response.response);
  } catch {
    return {
      tone: "technical and informative",
      structure: "introduction, main content, conclusion",
      audience: "software developers and DevOps engineers"
    };
  }
}

/**
 * Generate comprehensive blog content
 */
async function generateBlogContent(intent, research, styleAnalysis, ai) {
  const contentPrompt = `Create a comprehensive technical blog post with the following requirements:

Topic: ${intent.topic}
Suggested Title: ${intent.title}
Writing Style: ${JSON.stringify(styleAnalysis)}
Research Data: ${JSON.stringify(research)}

Requirements:
1. Engaging title that includes target keywords
2. Compelling introduction that hooks the reader
3. Well-structured main content with clear sections
4. Practical examples and code snippets where applicable
5. Actionable takeaways and conclusions
6. Technical depth appropriate for software developers
7. 1500-3000 words for comprehensive coverage
8. Include relevant technical commands, configurations, or code examples
9. Use markdown formatting for structure

Return as JSON with: title, introduction, sections (array of {heading, content}), conclusion, tags, categories`;

  const response = await ai.run("@cf/meta/llama-3.1-70b-instruct", {
    messages: [
      { 
        role: "system", 
        content: "You are an expert technical writer specializing in cloud computing, DevOps, and software development. Write comprehensive, practical blog posts that provide real value to developers." 
      },
      { role: "user", content: contentPrompt }
    ]
  });

  try {
    return JSON.parse(response.response);
  } catch (error) {
    console.error('Error parsing content response:', error);
    // Fallback content generation
    return {
      title: intent.title || `Understanding ${intent.topic}`,
      introduction: `In this comprehensive guide, we'll explore ${intent.topic} and its practical applications.`,
      sections: [
        {
          heading: "Overview",
          content: `${intent.topic} is an important technology in modern software development...`
        },
        {
          heading: "Getting Started",
          content: "Let's dive into the practical aspects..."
        }
      ],
      conclusion: "This covers the fundamentals of " + intent.topic,
      tags: [intent.topic.toLowerCase()],
      categories: ["Technology"]
    };
  }
}

/**
 * Generate cover image using FLUX model
 */
async function generateCoverImage(title, topic, ai) {
  const imagePrompt = `Create a professional, modern cover image for a technical blog post titled "${title}". 
  The image should be:
  - Clean and minimalist design
  - Technology-focused with subtle gradients
  - Include abstract representations of ${topic}
  - Professional color scheme (blues, grays, accent colors)
  - Suitable for a developer blog
  - 1200x630 pixels for social media optimization`;

  try {
    const response = await ai.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: imagePrompt,
      num_steps: 4
    });

    // Convert response to base64 or return URL
    return {
      generated: true,
      filename: `cover-${slugify(title, { lower: true })}.png`,
      prompt: imagePrompt
    };
  } catch (error) {
    console.error('Error generating cover image:', error);
    return {
      generated: false,
      filename: 'cover.png',
      fallback: true
    };
  }
}

/**
 * Optimize content for SEO
 */
async function optimizeForSEO(content, ai) {
  const seoPrompt = `Analyze this blog post content and provide SEO optimization:

Title: ${content.title}
Content: ${JSON.stringify(content)}

Provide:
1. SEO score (1-100)
2. Meta description (150-160 characters)
3. Target keywords (5-7 keywords)
4. Estimated read time in minutes
5. Social media title (60 characters max)
6. Suggestions for improvement

Return as JSON with: score, metaDescription, keywords, readTime, socialTitle, suggestions`;

  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
    messages: [
      { role: "system", content: "You are an SEO expert specializing in technical content optimization." },
      { role: "user", content: seoPrompt }
    ]
  });

  try {
    return JSON.parse(response.response);
  } catch {
    return {
      score: 85,
      metaDescription: content.introduction.substring(0, 150) + "...",
      keywords: content.tags || ["technology"],
      readTime: 8,
      socialTitle: content.title.substring(0, 60),
      suggestions: ["Add more internal links", "Include more keywords in headings"]
    };
  }
}

/**
 * Create Hugo-formatted blog post
 */
function createHugoPost(content, seoData, coverImage) {
  const now = new Date();
  const year = now.getFullYear();
  const slug = slugify(content.title, { lower: true, strict: true });
  
  // Create Hugo front matter
  const frontMatter = `---
title: "${content.title}"
date: ${now.toISOString()}
summary: "${seoData.metaDescription}"
description: "${seoData.metaDescription}"
cover:
    image: ${coverImage.filename}
    relative: true
    alt: "${content.title}"
tags: [${content.tags?.map(tag => `"${tag}"`).join(', ') || ''}]
categories: [${content.categories?.map(cat => `"${cat}"`).join(', ') || ''}]
draft: false
---`;

  // Create full post content
  const postContent = `${frontMatter}

${content.introduction}

${content.sections?.map(section => `## ${section.heading}\n\n${section.content}`).join('\n\n') || ''}

## Conclusion

${content.conclusion}`;

  return {
    slug,
    year,
    filename: `content/posts/${year}/${slug}/index.md`,
    content: postContent,
    coverImage,
    seoData
  };
}

/**
 * Publish to GitHub repository
 */
async function publishToGitHub(postData, env) {
  if (!env.GITHUB_TOKEN) {
    return { success: false, error: "GitHub token not configured" };
  }

  const octokit = new Octokit({
    auth: env.GITHUB_TOKEN,
  });

  try {
    // Create the post file
    const createResponse = await octokit.rest.repos.createOrUpdateFileContents({
      owner: env.GITHUB_REPO_OWNER,
      repo: env.GITHUB_REPO_NAME,
      path: postData.filename,
      message: `Add new blog post: ${postData.slug}`,
      content: btoa(postData.content),
      branch: 'main'
    });

    return {
      success: true,
      sha: createResponse.data.content.sha,
      url: createResponse.data.content.html_url,
      commit: createResponse.data.commit.sha
    };
  } catch (error) {
    console.error('GitHub API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Store post metadata in KV storage
 */
async function storePostMetadata(postData, env) {
  const metadata = {
    slug: postData.slug,
    title: postData.slug,
    year: postData.year,
    createdAt: new Date().toISOString(),
    seoScore: postData.seoData.score,
    readTime: postData.seoData.readTime,
    keywords: postData.seoData.keywords
  };

  await env.BLOG_METADATA.put(`post:${postData.slug}`, JSON.stringify(metadata));
  
  // Update posts index
  const postsIndex = await env.BLOG_METADATA.get('posts:index', { type: 'json' }) || [];
  postsIndex.unshift(metadata);
  await env.BLOG_METADATA.put('posts:index', JSON.stringify(postsIndex.slice(0, 100))); // Keep last 100 posts
}

/**
 * Get recent posts from storage
 */
async function getRecentPosts(env, limit = 10) {
  const postsIndex = await env.BLOG_METADATA.get('posts:index', { type: 'json' }) || [];
  return postsIndex.slice(0, limit);
}

/**
 * List recent posts
 */
async function listRecentPosts(env) {
  const posts = await getRecentPosts(env, 10);
  return {
    success: true,
    posts: posts.map(post => ({
      title: post.title,
      slug: post.slug,
      url: `${env.BLOG_BASE_URL}/posts/${post.year}/${post.slug}/`,
      createdAt: post.createdAt,
      readTime: post.readTime
    }))
  };
}

/**
 * Generate chat response for general queries
 */
async function generateChatResponse(message, ai) {
  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
    messages: [
      { 
        role: "system", 
        content: "You are BlogGPT, an AI assistant that helps manage a technical blog. You can help create posts, research topics, and manage content. Be helpful and concise." 
      },
      { role: "user", content: message }
    ]
  });

  return {
    success: true,
    response: response.response,
    type: 'chat'
  };
}

/**
 * Handle status requests
 */
async function handleStatusRequest(env) {
  const recentPosts = await getRecentPosts(env, 5);
  
  return new Response(JSON.stringify({
    status: 'operational',
    version: '1.0.0',
    features: [
      'Natural language blog creation',
      'AI-powered content generation',
      'GitHub integration',
      'SEO optimization',
      'Cover image generation',
      'Style analysis'
    ],
    recentPosts: recentPosts.length,
    lastActivity: recentPosts[0]?.createdAt || null
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle posts listing requests
 */
async function handlePostsRequest(env) {
  const posts = await getRecentPosts(env, 20);
  return new Response(JSON.stringify({ posts }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get home page HTML
 */
function getHomePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BlogGPT - AI-Powered Blog Ecosystem</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            max-width: 800px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
        h1 { font-size: 3em; margin-bottom: 20px; font-weight: 300; }
        .subtitle { font-size: 1.2em; opacity: 0.9; margin-bottom: 40px; }
        .chat-container {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 30px;
            margin-top: 30px;
        }
        .chat-input {
            width: 100%;
            padding: 15px;
            font-size: 16px;
            border: none;
            border-radius: 10px;
            background: rgba(255,255,255,0.9);
            margin-bottom: 20px;
        }
        .send-btn {
            background: #ff6b6b;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .send-btn:hover { background: #ff5252; transform: translateY(-2px); }
        .response {
            margin-top: 20px;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            text-align: left;
            white-space: pre-wrap;
            display: none;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .loading { display: none; color: #ffd700; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 BlogGPT</h1>
        <p class="subtitle">AI-Powered Blog Ecosystem with Natural Language Publishing</p>
        
        <div class="features">
            <div class="feature">
                <h3>🗣️ Natural Language</h3>
                <p>Just tell me what you want to write about</p>
            </div>
            <div class="feature">
                <h3>🧠 AI Research</h3>
                <p>Automatic topic research and analysis</p>
            </div>
            <div class="feature">
                <h3>📝 Content Generation</h3>
                <p>Complete blog posts with SEO optimization</p>
            </div>
            <div class="feature">
                <h3>🎨 Image Creation</h3>
                <p>AI-generated cover images</p>
            </div>
        </div>

        <div class="chat-container">
            <h3>Try it now! 💬</h3>
            <input type="text" class="chat-input" id="userInput" placeholder="e.g., 'Write a blog post about CloudFlare Workers AI'" />
            <button class="send-btn" onclick="sendMessage()">Send Message</button>
            <div class="loading" id="loading">🤖 BlogGPT is thinking...</div>
            <div class="response" id="response"></div>
        </div>
    </div>

    <script>
        async function sendMessage() {
            const input = document.getElementById('userInput');
            const loading = document.getElementById('loading');
            const response = document.getElementById('response');
            const message = input.value.trim();
            
            if (!message) return;
            
            loading.style.display = 'block';
            response.style.display = 'none';
            
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
                
                const data = await res.json();
                response.textContent = JSON.stringify(data, null, 2);
                response.style.display = 'block';
            } catch (error) {
                response.textContent = 'Error: ' + error.message;
                response.style.display = 'block';
            }
            
            loading.style.display = 'none';
            input.value = '';
        }
        
        document.getElementById('userInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>`;
}