---
title: "Apply Cloudfront Security Headers With Terraform"
date: 2021-11-05T14:20:58+02:00
description: How to use Response Headers Policy and Terraform to configure security headers for CloudFront Distribution
summary: How to use Response Headers Policy and Terraform to configure security headers for CloudFront Distribution
cover:
    image: cover-image.png
    relative: true
tags: ["aws", "cloudfront", "security", "terraform"]
categories: [Amazon Web Services, Terraform]
showtoc: false
---
In November 2021, AWS announced Response Headers Policies — native support of response headers in CloudFront. You can read the full announcement here: [Amazon CloudFront introduces Response Headers Policies](https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-cloudfront-introduces-response-headers-policies/)

I said "native" because previously you could set response headers either using [CloudFront Functions](/2021/05/21/configure-http-security-headers-with-cloudfront-functions.html) or [Lambda@Edge](https://aws.amazon.com/blogs/networking-and-content-delivery/adding-http-security-headers-using-lambdaedge-and-amazon-cloudfront/).

And one of the common use cases for that was to set security headers. Now you don't need to add intermediate requests processing to modify the headers: CloudFront does that for you **with no additional fee**.

## Manage Security Headers as Code
Starting from the [3.64.0](https://github.com/hashicorp/terraform-provider-aws/blob/main/CHANGELOG.md#3640-november-04-2021) version of Terraform AWS provider, you can create the security headers policies and apply them for your distribution.

Let's see how that looks!

First, you need to describe the `aws_cloudfront_response_headers_policy` resource:

```hcl
resource "aws_cloudfront_response_headers_policy" "security_headers_policy" {
  name = "my-security-headers-policy"
  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "same-origin"
      override        = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
    strict_transport_security {
      access_control_max_age_sec = "63072000"
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    content_security_policy {
      content_security_policy = "frame-ancestors 'none'; default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'"
      override                = true
    }
  }
}
``` 

List of security headers used:
- [X-Content-Type-Options](https://infosec.mozilla.org/guidelines/web_security#x-content-type-options) 
- [X-Frame-Options](https://infosec.mozilla.org/guidelines/web_security#x-frame-options)
- [Referrer Policy](https://infosec.mozilla.org/guidelines/web_security#referrer-policy)
- [X-XSS-Protection](https://infosec.mozilla.org/guidelines/web_security#x-xss-protection)
- [Strict Transport Security](https://infosec.mozilla.org/guidelines/web_security#http-strict-transport-security)
- [Content Security Policy](https://infosec.mozilla.org/guidelines/web_security#content-security-policy)

The values for the security headers can be different, of course. However, the provided ones cover the majority of cases. And you can always get the up to date info about these headers and possible values here: [Mozilla web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)

Also, you could notice that provided example uses the `override` argument a lot. The `override` argument tells CloudFront to set these values for specified headers despite the values received from the origin. This way, you can enforce your security headers configuration.

Once you have the `aws_cloudfront_response_headers_policy` resource, you can refer to it in the code of `aws_cloudfront_distribution` resource inside cache behavior block (default or ordered). For example, in your `default_cache_behavior`:

```hcl
resource "aws_cloudfront_distribution" "test" {
  default_cache_behavior {
    target_origin_id           = aws_s3_bucket.my_origin.id
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    viewer_protocol_policy     = "redirect-to-https"

    # some arguments skipped from listing for the sake of simplicity
    
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers_policy.id
    
  }

  # some arguments skipped from listing for the sake of simplicity
}
```

### Security Scan Results

Here is what Mozilla Observatory reports about my test CF distribution where I enabled the policy described above:

{{< figure src="observatory-results.png" caption="Scan summary for CloudFront distribution with security headers policy" >}}

So with just minimum effort, you can greatly boost your web application security posture.

### More to read:
- [Terraform Resource: aws_cloudfront_response_headers_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_response_headers_policy)
- [Creating response headers policies - Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/creating-response-headers-policies.html)
- [Using the managed response headers policies - Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-response-headers-policies.html)
- [Understanding response headers policies - Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/understanding-response-headers-policies.html)
