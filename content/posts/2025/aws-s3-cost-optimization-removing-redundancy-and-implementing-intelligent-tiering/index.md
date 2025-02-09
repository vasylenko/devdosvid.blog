---
title: "Aws S3 Cost Optimization: Removing Redundancy and Implementing Intelligent Tiering"
date: 2025-02-09T02:48:15+01:00
summary: ~112 or ~22 words
description: ~112 or ~22 words
cover:
    image: cover-image.png
    relative: true
    alt:
tags: []
categories: []
---

Legacy architectural decisions often carry hidden costs. Here's how questioning a storage replication setup saved us nearly a quarter of a million dollars.

This is a technical walkthrough of identifying, analyzing, and solving two specific S3 cost optimization problems: eliminating unnecessary data and implementing intelligent storage tiering. 

_Note: All mentioned AWS prices are from January 2025 in the us-east-1 region. AWS pricing and features may have changed since the publication._

# The setting
Picture this: In December 2024, two S3 buckets quietly consumed about $19,500. The price is just for one month. That's nearly $235,000 annually, but the size of buckets slowly grows, so it's going to be more.
We use [JFrog Artifactory](https://jfrog.com/artifactory/), which supports AWS S3 as a file storage. 
One bucket is a replica of another, and that original bucket contains CI/CD builds and third-party artifacts — essential data we need daily, yet not to the extent that it should cost $120,000 a year.

Now the question is: WHY do we have such a setup with replication? As always happens, that was configured long ago, so no one knows by now.

But let's give this a fresh look: S3 provides 11-nines durability by design; if something gets deleted by accident, we can always re-run CI/CD and build that again. 

The problem statement is simple: the buckets are enormous, we pay half the price for nothing, and the amount of data might grow more.

- Two S3 buckets: main in us-east-1 and replica in us-west-2
- About 320TB each
- 20+ million objects per bucket
- 7% monthly growth rate based on the last 12 months' trend

The two-fold solution to that was not that trivial, though. 

# Addressing the unpredicted S3 bucket growth and access patterns
By the design of S3 service, a client (you or your application) should specify the storage class when uploading the object to an S3 bucket; there is no "default storage class for new objects" feature.

Surprisingly, despite quite versatile configuration options for S3, JFrog Artifactory does not support setting storage classes for the objects. So, everything you store is stored in the Standard storage class.

Moreover, on a large scale, with many teams and projects, it is pretty hard to predict the lifetime and the frequency of one or other artifact for the particular team. [Auto-cleanup options](https://jfrog.com/help/r/artifactory-cleanup-best-practices/artifactory-cleanup-best-practices) are built into Artifactory, but they do not answer the retention questions anyway: How long? How frequent?

Luckily, AWS has two powerful things to offer to address that:
1. [Intelligent-Tiering storage class](https://aws.amazon.com/getting-started/hands-on/getting-started-using-amazon-s3-intelligent-tiering/)
2. [Lifecycle Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)

## Benefits of Intelligent-Tiering Storage class

As its name implies, Intelligent-Tiering automatically defines the best access tier when access patterns change. There are three basic tiers: one is optimized for frequent access, another for infrequent access, and a very low-cost tier, which is optimized for rarely accessed data.

{{< figure 
    src="s3-intelligent-tiering.png" 
    caption="S3 Intelligent-Tiering" 
    alt="S3 Intelligent-Tiering" 
    width="800" 
>}}

For a relatively small price, which is negligible on scale, S3 does the monitoring and tier transition:

- Monitoring: $0.0025 per 1,000 objects/month
- Storage for GB/month:
	- $0.021 — frequent tier
	- $0.0125 — infrequent tier (30 days without access)
	- $0.004 — archive tier (90 days without access)

The vast advantage comes here with the infrequent and archive tier prices on scale.

## Lifecycle Configuration to move S3 objects between storage classes
So, the Intelligent-Tiering storage class is great, but what about all those objects uploaded and stored with the Standard storage class?

Here comes Lifecycle Configuration. S3 Lifecycle also manipulates objects, but the key difference between Intelligent-Tiering and Lifecycle Configuration is that Configuration does not have the access pattern analysis as a trigger — the only trigger for Configuration is the time (e.g., trigger in N days).

However, a trigger by time mark is precisely what's needed when your software does not support the custom storage classes — you want to move objects as soon as possible to Intelligent-Tiering using Lifecycle Configuration. 

Here's how you need to configure the Lifecycle:
- Apply to all objects in the bucket
- Actions:
	- The 1st option — Transition current versions of objects between storage classes
	- The 2nd option — Transition noncurrent versions of objects between storage classes
- Specify Intelligent-Tiering for "Transition current version" and "Transition noncurrent versions"
- Set 0 as the number of "Days after object creation" and "Days after objects become noncurrent"

{{< figure 
    src="s3-lifecycle-move-to-it.png" 
    caption="S3 Lifecycle Rule: Move to Intelligent-Tiering" 
    alt="S3 Lifecycle Rule: Move to Intelligent-Tiering" 
    width="800" 
>}}

A zero value here does not mean an immediate change of the storage class: by design, the transition will be executed at midnight UTC from the object upload date. For existing objects, the transition will begin at midnight UTC after the lifecycle rule is applied.

{{< attention >}}
I confirmed with AWS technical support that there are no indications of throttling or limitations on object access during transitions. All objects remain accessible during the transition process.
{{< /attention >}}

Lifecycle Configuration has a price of $0.01 per 1,000 Transition requests, which technically adds $0.00001 as the one-time cost of each object affected by the policy. 

For example, in my case, moving 21 million objects to the Intelligent-Tiering class had a one-time cost of $210, but ROI for this is much more significant the next month.

# Untrivial termination of a large S3 bucket
How hard can it be to empty and delete the bucket with 21 million objects inside? (To clarify: S3 does not allow deletion of a non-empty bucket)

The most obvious way, at first glance, would be to use the AWS S3 web Console option called "Empty", right?

{{< figure 
    src="s3-empty-bucket.png" 
    caption="S3 Empty Bucket" 
    alt="S3 Empty Bucket" 
    width="800" 
>}}

Alas, it is not that simple:
- When you go that way, it is your browser who removes the objects by sending API calls to AWS; there is no background job for you. It does that efficiently, sending DELETE requests in 1000-item batches, but it does that as long as your IAM session remains active (or the browser window remains open, whatever ends first).
- If your bucket has Bucket Versioning enabled, this action will not remove all the object versions. 

So then we have two other options:
- Either run some script that removes all object versions (including current, older, and null versions) and delete markers.
- Or set up a couple of other Lifecycle Configuration rules to do that in an unattended way.

If the total number of objects is relatively small, e.g., up to few hundred thousand, you can run a script that removes all object versions and delete markers.
{{< snippet >}}
```python
#!/usr/bin/env python3

import sys
import boto3

def purge_bucket_interactive(bucket_name: str) -> None:
    """
    Display the bucket ARN and region, warn the user, and prompt them to type
    'YES' in uppercase. If confirmed, permanently remove all object versions
    (including current, older, and null versions) and delete markers.
    """

    # We use the S3 client to query bucket location info
    s3_client = boto3.client("s3")
    response = s3_client.get_bucket_location(Bucket=bucket_name)
    region = response.get("LocationConstraint") or "us-east-1"

    # Construct the bucket's ARN (for standard S3 buckets, the region is not typically embedded)
    bucket_arn = f"arn:aws:s3:::{bucket_name}"

    print(f"Bucket ARN   : {bucket_arn}")
    print(f"Bucket region: {region}")
    print("WARNING: This will permanently remove ALL VERSIONS of every object.")
    print("It is NOT REVERSIBLE!!!\n")

    confirm = input("Type 'YES' in uppercase to proceed with the permanent removal: ").strip()
    if confirm != "YES":
        print("Aborted. No changes made.")
        return

    # Proceed with deletion
    print("Starting purge... This might take a while.")

    # Use the S3 resource to delete all versions
    s3 = boto3.resource("s3")
    bucket = s3.Bucket(bucket_name)
    bucket.object_versions.all().delete()

    print("All object versions and delete markers have been removed.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <bucket_name>")
        sys.exit(1)

    bucket_to_purge = sys.argv[1]
    purge_bucket_interactive(bucket_to_purge)
```
{{< /snippet >}}

{{< attention >}}
But if you have millions of objects, you'd better use Lifecycle Configuration rules to empty a version-enabled bucket.
{{< /attention >}}

First, you need to pause the versioning. Then, create two Lifecycle Configuration rules.

**The first rule will delete all versions of the objects:**
- Apply to all objects in the bucket
- Actions:
	- The 3rd option — "Expire current versions of objects"
	- The 4th option — "Permanently delete previous versions of objects"
- The number of days you would like the current version to expire, to do as soon as possible, enter 1 in the text box. That makes it "1 day".
- For the days after which the noncurrent versions will be permanently deleted, enter 1 in the text box. That makes it "1 day" of being noncurrent.

{{< figure 
    src="s3-lifecycle-delete-versions.png" 
    caption="S3 Lifecycle Rule: Delete Versions" 
    alt="S3 Lifecycle Rule: Delete Versions" 
    width="800" 
>}}

Due to how S3 versioning works, a special DELETE marker will be created for each object processed by the first rule. To handle the delete markers, you must create a new lifecycle rule, as you won’t be able to select the option to delete the "delete markers" in the first rule.

**For the second lifecycle rule**, the steps are similar, and the only difference is that you must select the 5th and last option: "Delete expired object delete markers or incomplete multipart uploads." Select both the options — "Delete expired object delete markers" and "Delete incomplete multipart uploads" — and set it to 1 day. 

{{< figure 
    src="s3-lifecycle-delete-markers.png" 
    caption="S3 Lifecycle Rule: Delete Markers" 
    alt="S3 Lifecycle Rule: Delete Markers" 
    width="800" 
>}}

{{< attention >}}
S3 Lifecycle operations are asynchronous, and it may take some time for the Lifecycle to delete the objects in your S3 bucket. However, at midnight UTC, once the S3 objects are marked for expiration, you are no longer charged for storing that objects, and S3 will do the rest.
{{< /attention >}}

# Implementation Results
- Cost reduction: $120,000 annually 
- One-time transition cost: $210
- Implementation time: 2 days
- Storage class transition completed in 1 day

# Key Takeaways
- Don't assume current architectures are still optimal.
- Challenge redundancy — is it providing real value?
- Regular cost reviews can be the source of quick wins.
- AWS Simple Storage Service, despite its name, might be tricky, but AWS has a bunch of tools to help you.
- Let automated solutions do the job, and do not overengineer things.


S3 Lifecycle rules proved their worth twice: first by automating our transition to Intelligent-Tiering despite Artifactory's limitations and then by cleaning up millions of versioned objects without operational overhead.