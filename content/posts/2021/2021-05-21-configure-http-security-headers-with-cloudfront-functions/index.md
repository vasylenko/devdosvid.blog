---
date: "2021-05-21T00:00:00Z"
description: Modifying response headers to enforce the security of the web application
summary: Modifying response headers to enforce the security of the web application
images: ["cover_image.png"]
cover:
    image: "cover-image.png"
tags: ["aws", "cloudfront", "security"]
categories: [Amazon Web Services]
title: Configure HTTP Security headers with CloudFront Functions
aliases: ["/2021/05/21/configure-http-security-headers-with-cloudfront-functions.html"]
---

{{< updatenotice >}}
In November 2021, AWS has added this functionality as a native CloudFront feature.

I suggest switching to the native implementation. I have described how to configure Security Response Headers for CloudFront in the following article:

[Apply Cloudfront Security Headers With Terraform](/2021/11/05/apply-cloudfront-security-headers-with-terraform/)
{{< /updatenotice >}}

A couple of weeks ago, AWS released CloudFront Functions — a “true edge” compute capability for the CloudFront.

It is “true edge” because Functions work on 200+ edge locations ([link to doc](https://aws.amazon.com/cloudfront/features/?whats-new-cloudfront.sort-by=item.additionalFields.postDateTime&whats-new-cloudfront.sort-order=desc#Edge_Computing)) while its predecessor, the Lambda@Edge, runs on a small number of regional edge caches.

One of the use cases for Lambda@Edge was adding security HTTP headers (it’s even listed on the [product page](https://aws.amazon.com/lambda/edge/)), and now there is one more way to make it using CloudFront Functions. 

## What are security headers, and why it matters
Security Headers are one of the web security pillars.

They specify security-related information of communication between a web application (i.e., website) and a client (i.e., browser) and protect the web app from different types of attacks. Also, HIPAA and PCI, and other security standard certifications generally include these headers in their rankings. 

We will use CloudFront Functions to set the following headers:
-  [Content Security Policy](https://infosec.mozilla.org/guidelines/web_security#content-security-policy)
-  [Strict Transport Security](https://infosec.mozilla.org/guidelines/web_security#http-strict-transport-security)
-  [X-Content-Type-Options](https://infosec.mozilla.org/guidelines/web_security#x-content-type-options)
-  [X-XSS-Protection](https://infosec.mozilla.org/guidelines/web_security#x-xss-protection)
-  [X-Frame-Options](https://infosec.mozilla.org/guidelines/web_security#x-frame-options)
-  [Referrer Policy](https://infosec.mozilla.org/guidelines/web_security#referrer-policy)
   
You can find a short and detailed explanation for each security header on [Web Security cheatsheet made by Mozilla](https://infosec.mozilla.org/guidelines/web_security)

## CloudFront Functions overview
In a nutshell, CloudFront Functions allow performing simple actions against HTTP(s) request (from the client) and response (from the CloudFront cache at the edge). Functions take less than one millisecond to execute, support JavaScript (ECMAScript 5.1 compliant), and cost $0.10 per 1 million invocations.

Every CloudFront distribution has one (default) or more Cache behaviors, and Functions can be associated with these behaviors to execute upon a specific event.

That is how the request flow looks like in general, and here is where CloudFront Functions execution happens: 

{{<figure src="request_flow.png">}}

CloudFront Functions support Viewer Request (after CloudFront receives a request from a client) and Viewer Response (before CloudFront forwards the response to the client) events.

You can read more about the events types and their properties here — [CloudFront Events That Can Trigger a Lambda Function - Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-cloudfront-trigger-events.html).  

Also, the CloudFront Functions allow you to manage and operate the code and lifecycle of the functions directly from the CloudFront web interface.

## Solution overview

CloudFront distribution should exist before Function creation so you could associate the Function with the distribution.

Creation and configuration of the CloudFront Function consist of the following steps:

### Create Function
In the AWS Console, open CloudFront service and lick on the Functions on the left navigation bar, then click Create function button.
{{<figure src="create_function.png">}}
Enter the name of your Function (e.g., “security-headers”) and click Continue.

### Build Function
On the function settings page, you will see four tabs with the four lifecycle steps: Build, Test, Publish, Associate.

Paste the function code into the editor and click “Save.”

{{<figure src="function_editor.png">}}

Here is the source code of the function:
```javascript
function handler(event) {
var response = event.response;
var headers = response.headers;

headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload'}; 
headers['content-security-policy'] = { value: "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'"}; 
headers['x-content-type-options'] = { value: 'nosniff'}; 
headers['x-xss-protection'] = {value: '1; mode=block'};
headers['referrer-policy'] = {value: 'same-origin'};
headers['x-frame-options'] = {value: 'DENY'};

return response;
}
```
### Test Function
Open the “Test” tab — let’s try our function first before it becomes live!

Select Viewer Response event type and Development Stage, then select “Viewer response with headers” as a Sample test event (you will get a simple set of headers automatically).

Now click the blue “Test” button and observe the output results:
- Compute utilization represents the relative amount of time (on a scale between 0 and 100) your function took to run
- Check the Response headers tab and take a look at how the function added custom headers.

{{<figure src="function_test.png">}}

### Publish Function
Let’s publish our function. To do that, open the Publish tab and click on the blue button “Publish and update.”
{{<figure src="function_publish.png">}}

### Associate your Function with CloudFront distribution
Now, you can associate the function with the CloudFront distribution.

To do so, open the Associate tab, select the distribution and event type (Viewer Response), and select the Cache behavior of your distribution which you want to use for the association.

{{<figure src="function_associate.png">}}

Once you associate the function with the CloudFront distribution, you can test it in live mode.

I will use curl here to demonstrate it:

```shell
> curl -i https://d30i87a4ss9ifz.cloudfront.net
HTTP/2 200
content-type: text/html
content-length: 140
date: Sat, 22 May 2021 00:22:18 GMT
last-modified: Tue, 27 Apr 2021 23:07:14 GMT
etag: "a855a3189f8223db53df8a0ca362dd62"
accept-ranges: bytes
server: AmazonS3
via: 1.1 50f21cb925e6471490e080147e252d7d.cloudfront.net (CloudFront)
content-security-policy: default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'
strict-transport-security: max-age=63072000; includeSubdomains; preload
x-xss-protection: 1; mode=block
x-frame-options: DENY
referrer-policy: same-origin
x-content-type-options: nosniff
x-cache: Miss from cloudfront
x-amz-cf-pop: WAW50-C1
x-amz-cf-id: ud3qH8rLs7QmbhUZ-DeupGwFhWLpKDSD59vr7uWC65Hui5m2U8o2mw==
```

You can also test your results here — [Mozilla Observatory](https://observatory.mozilla.org/)

{{<figure src="scan_result-1.png">}}
{{<figure src="scan_result-2.png">}}

## Read more
That was a simplified overview of the CloudFront Functions capabilities.

But if you want to get deeper, here is a couple of useful links to start:
- Another overview from AWS — [CloudFront Functions Launch Blog](https://aws.amazon.com/blogs/aws/introducing-cloudfront-functions-run-your-code-at-the-edge-with-low-latency-at-any-scale)
- More about creating, testing, updating and publishing of CloudFront Functions — [Managing functions in CloudFront Functions - Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/managing-functions.html)


## So what to choose?
CloudFront Functions are simpler than Lambda@Edge and run faster with minimal latency and minimal time penalty for your web clients.

Lambda@Edge takes more time to invoke, but it can run upon Origin Response event so that CloudFront can cache the processed response (including headers) and return it faster afterward.

But again, the CloudFront Functions invocations are much cheaper (6x times) than Lambda@Edge, and you do not pay for the function execution duration.

The final decision would also depend on the dynamic/static nature of the content you have at your origin.

To make a wise and deliberate decision, try to analyze your use case using these two documentation articles:
- [Choosing between CloudFront Functions and Lambda@Edge](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions.html)
- [How to Decide Which CloudFront Event to Use to Trigger a Lambda Function](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-how-to-choose-event.html)




