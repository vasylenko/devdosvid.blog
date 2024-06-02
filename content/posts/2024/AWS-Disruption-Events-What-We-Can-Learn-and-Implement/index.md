---
title: "AWS Disruption Events: What We Can Learn and Implement"
date: 2024-06-03T00:52:54+02:00
summary: "Discover essential insights from AWS post-event reports to optimize your systems, ensuring robust monitoring, redundancy, and continuous improvement"
description: "Discover essential insights from AWS post-event reports to optimize your systems, ensuring robust monitoring, redundancy, and continuous improvement"
cover:
    image: cover-image.png
    relative: true
    alt:
tags: [aws, cloud, monitoring, redundancy, continuous-improvement, post-event-reports, incident-response, incident-management]
categories: []
draft: true
---

This post will explore valuable lessons from AWS Post-Event Summaries[^1] by analyzing reported incidents and their impact on AWS service offerings. These reports provide detailed insights into system design, capacity planning, software testing, monitoring, and automated recovery processes.

Learning from these real-world scenarios, we can uncover effective strategies for enhancing your systems' resilience and reliability.

Let’s dive into these lessons and discover actionable insights to fortify your infrastructure against unexpected challenges.

## Importance of Redundancy and Isolation in System Design
These incidents highlight the importance of designing systems with multiple layers of redundancy and isolation.

While AWS designs its infrastructure with redundancy in mind, these events show that failures can still occur, especially during unforeseen events like natural disasters. But even if you work solely with SaaS solutions and never touch hardware, these are still good illustrations of cascading failures that can happen anywhere.

US East, June 2012. A large-scale electrical storm led to power fluctuations and outages in the US East region. Backup systems in unaffected Availability Zones functioned as designed, preventing customer impact. However, two data centers supporting a single Availability Zone experienced generator failures, leading to EC2, EBS, RDS, and ELB downtime.

Asia Pacific, June, 2016. A utility power loss due to severe weather impacted multiple AWS facilities in the Sydney region. While most facilities' power redundancy worked, one facility experienced failures, causing outages for EC2 instances and EBS volumes.

US East, November 2020. A capacity addition triggered an unexpected behavior in the front-end fleet responsible for request routing, impacting Kinesis and dependent services like Cognito, CloudWatch, Auto Scaling, and Lambda

US East, December 2021. An automated scaling activity that overwhelmed networking devices connecting the internal AWS network to the main network. This congestion affected control planes for services like EC2, RDS, EMR, ELB, and Route 53, impacting CloudWatch monitoring and console access.

**Essential findings from these incidents**:
* Aim to design systems with multiple layers of redundancy for critical components.
* Isolation is crucial to prevent cascading failures. Ensure systems are designed to limit the impact of failures to specific zones or components, including cascade failures of dependent components.
* Regularly test and validate redundancy and isolation measures to ensure they function as expected.

## Capacity Planning and Management for Unexpected Events
These events demonstrate the importance of capacity planning that accounts for unexpected events and failure scenarios. Sufficient spare capacity is crucial to maintain service availability and effectively manage recovery processes.

US East, April 2011: A re-mirroring storm in the EBS cluster, triggered by a network configuration change, led to increased latency and errors in EBS and EC2. AWS lacked sufficient excess capacity to absorb the re-mirroring requests, exacerbating the issue.

US West, August 2014: A power outage in a single Availability Zone in the EU West region impacted EC2, EBS, and RDS. Many EBS volumes that lost power overwhelmed the available spare capacity, causing delays in re-mirroring and recovery.

**Notable observations here**:
* Implement robust capacity planning that considers potential failure scenarios and incorporates a safety buffer.
* Regularly review and adjust capacity planning based on usage patterns, growth projections, and learnings from past events.
* Implement automated scaling mechanisms to quickly provision additional resources during unexpected surges in demand or during recovery.

## Thorough Testing and Gradual Rollout of Software Changes
These incidents underline the importance of thorough software testing, including testing for edge cases and unexpected interactions. They also emphasize the need for careful and gradual rollout of software changes to limit the potential impact of unforeseen bugs.

US East, October 2012: A latent bug in an EBS data collection agent, triggered by a DNS update, led to a memory leak and impacted EBS volumes and EC2 instances. The bug was not caught during testing as it required a specific sequence of events.

US West, August 2014: An EBS software bug related to snapshot cleanup led to the accidental deletion of blocks from some snapshots. Although a human verification step was in place, it failed to catch the error.

Asia Pacific, November 2018:  incorrect capacity settings for the EC2 DNS resolver service in the Seoul region led to DNS resolution failures for EC2 instances

US East, June 2023. A latent software bug in the Lambda Frontend caused increased error rates and latencies for function invocations, impacting services like STS, AWS Management Console, EKS, Connect, and EventBridge

**Key learnings from these incidents**:
* Implement rigorous testing processes that cover various scenarios, including edge cases, race conditions, and unexpected interactions between components.
* Utilize automated testing tools to improve test coverage and efficiency.
* Implement configuration validation: Before it is allowed to be committed, make sure that the new configuration satisfies some set of logical constraints.
* Adopt a phased rollout approach for software releases, gradually exposing the changes to a small subset of users or traffic before a full rollout.

## Importance of Monitoring and Alerting Systems
These events illustrate the crucial role of comprehensive monitoring and alerting systems in maintaining service reliability. Granular monitoring of key system metrics and well-defined alerting thresholds can help identify issues early on before they escalate into major incidents.

US East, April 2011: The initial re-mirroring storm in the EBS cluster was not immediately detected due to insufficient granular alarming on a specific EBS control plane API.

US East, October 2012: AWS's monitoring system did not catch a memory leak in the EBS data collection agent, which only tracked aggregate memory consumption on each EBS server.

US East, November 2020: The variety of errors observed hampered the diagnosis of the Kinesis Data Streams issue, making it challenging to isolate the root cause quickly.

**These examples can teach us the following**:
* Implement comprehensive monitoring that covers all critical system components and processes, tracking key performance and health indicators.
* Set up granular alerting thresholds based on historical data and service level objectives (SLOs) to trigger notifications promptly when deviations occur.
* Regularly review and fine-tune monitoring and alerting systems based on evolving system behavior, new failure modes, and learnings from past events.

## Robust Automated Recovery Processes
These incidents emphasize the importance of robust automated recovery processes. Automated recovery can significantly reduce downtime by quickly detecting and responding to failures, restoring service availability faster than manual intervention.

US East, April 2011: Manually restoring EBS volumes from S3 snapshots during the incident proved time-consuming, leading AWS to explore ways to automate the recovery process for future events.

EU West, August 2014: Recovering "stuck" and inconsistent EBS volumes involved lengthy processes of creating and transferring snapshots to S3, highlighting the need for faster recovery mechanisms.

**Here's what we can learn from that**:
* Design systems with automated recovery mechanisms for critical components and services.
* Prioritize automated recovery over manual intervention to minimize downtime.
* Regularly test and validate recovery processes to ensure they function as intended and meet recovery time objectives (RTOs).

## Importance of Multi-Availability Zone Architectures
These events highlight the importance of designing applications for multiple Availability Zones. While AWS Availability Zones are designed to be independent, events can still impact control planes or other regional services, emphasizing the need for application-level fault tolerance.

US East, April 2011: While the primary impact was limited to a single Availability Zone, the degradation of the EBS control plane affected the ability to create and manage EBS volumes across the region, highlighting the need for better isolation.

US East, June 2012: The power outage in a single Availability Zone impacted control planes for EC2, EBS, and ELB, making it difficult for customers to react to resource loss by migrating to other zones.

**This outlines the following insights**:
* Design applications with a multi-availability zone architecture to ensure redundancy and fault tolerance.
* Leverage AWS services that offer multi-AZ deployments by default, such as RDS Multi-AZ and ELB, with multiple Availability Zone support.
* Test and validate application behavior during Availability Zone failures to ensure seamless failover and minimal downtime.

## API Throttling Strategies and Customer Impact
This event demonstrates the importance of carefully considering the impact of API throttling strategies on customers. While throttling is essential for maintaining service stability during high load or unexpected events, overly aggressive throttling can hinder customers' ability to manage their applications and recover from incidents.

US East, October 2012: An aggressive API throttling policy implemented to stabilize the system disproportionately impacted some customers, hindering their ability to manage their resources during the event.

**Key takeaways**:
* Design API throttling mechanisms with customer impact in mind.
* Implement granular throttling policies that target specific API calls or customer segments rather than applying broad, blanket throttling.
* Monitor the impact of throttling in real time and make adjustments as needed to minimize disruption to customer offerings.

## Human Factors and Operational Processes
These events demonstrate that human error can significantly affect operational incidents. Implementing strong operational processes, access controls, and automation can minimize the risk of human error and reduce the potential impact of such errors.

US East, April 2011: A network configuration change triggered the initial re-mirroring storm, highlighting the need for robust change management processes and increased automation.

EU West, August 2014: A human error in entering an input for an operational command led to the accidental removal of a larger set of servers than intended, causing the S3 disruption.

US East, December 2012: An incorrect configuration setting, which was supposed to be temporary, led to persistent access to production data, resulting in the accidental deletion of ELB state data.

**Here's what we can learn from that**:
* Establish robust change management processes, including thorough risk assessments, testing, and approvals before implementing changes.
* Implement the principle of least privilege for accessing critical systems and data, limiting access to authorized personnel.
* Automate repetitive tasks and operational processes to minimize the potential for human error.

## Importance of Continuous Improvement and Learning
After each event, AWS conducts detailed analyses, identifies areas for improvement, and implements changes to its systems, processes, and technologies to prevent similar incidents from recurring. A consistent theme across all AWS incident reports is the company's commitment to continuous improvement and learning from operational failures.

By openly sharing these learnings and taking concrete steps to address the root causes of these events, AWS demonstrates its dedication to improving service reliability and maintaining customer trust.

To summarize the key learnings outlined earlier in this blog:
* **Design for Failure**: Systems should be built to withstand component failures. Implement redundancy, failover mechanisms, and capacity buffers to mitigate disruptions.
* **Continuous Monitoring and Improvement**: Proactive monitoring and analysis of system metrics are crucial for identifying potential issues before they escalate. Use monitoring data to enhance capacity planning, adjust retry logic, and optimize system performance.
* **Thorough Testing and Deployment**: Rigorous testing in the lab and controlled production environments is essential for uncovering latent bugs. Implement gradual rollouts and robust rollback procedures for new code and configuration changes.
* **Transparent and Timely Communicatio**n: Establish clear communication channels and protocols for operational events. Provide regular updates to stakeholders, even if the root cause remains unknown.
* **Learn from Every Event**: Conduct thorough post-mortems after any operational issue. Identify root causes, document lessons learned, and implement changes to prevent similar events in the future.

[^1]: List of AWS Post-Event Summaries mentioned in this blog post:
    - [Summary of the Amazon EC2 and Amazon RDS Service Disruption in the US East Region, April 21, 2011](https://aws.amazon.com/message/65648/)
    - [Summary of the AWS Service Event in the US East Region, June 29, 2012](https://aws.amazon.com/message/67457/)
    - [Summary of the AWS Service Event in the US-East Region, October 22, 2012](https://aws.amazon.com/message/680342/)
    - [Summary of the Amazon ELB Service Event in the US-East Region, December 24, 2012](https://aws.amazon.com/message/680587/)
    - [Summary of the Amazon EC2, Amazon EBS, and Amazon RDS Service Event in the EU West Region, August 7, 2014](https://aws.amazon.com/message/2329B7/)
    - [Summary of the AWS Service Event in the Sydney Region, June 4, 2016](https://aws.amazon.com/message/4372T8/)
    - [Summary of the Amazon EC2 DNS Resolution Issues in the Asia Pacific (Seoul) Region (AP-NORTHEAST-2), November 22, 2018](https://aws.amazon.com/message/74876/)
    - [Summary of the Amazon Kinesis Event in the Northern Virginia (US-EAST-1) Region, November 25, 2020](https://aws.amazon.com/message/11201/)
    - [Summary of the AWS Service Event in the Northern Virginia (US-EAST-1) Region, December 7, 2021](https://aws.amazon.com/message/12721/)
    - [Summary of the AWS Lambda Service Event in Northern Virginia (US-EAST-1) Region, June 13, 2023](https://aws.amazon.com/message/061323/)