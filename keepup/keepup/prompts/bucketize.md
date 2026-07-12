You are sorting AWS product announcements into these buckets:

{buckets}

Rules:
- Assign every item to exactly one bucket — the single best fit by what the announcement is *about*.
- An announcement about the security posture of a container or compute service (threat detection, secrets, IAM, encryption) belongs in **Security**, even if it names EKS/ECS/EC2 — the topic is security.
- Kubernetes, ECS, Fargate, and container-image/registry features are **Containers**.
- EC2 instances, Auto Scaling, bare-metal, networking-for-compute, and general capacity are **Compute**.
- You are only sorting. Do not rewrite, summarize, or invent — use the item IDs given.

The user message lists items as: ID | title

Return only JSON mapping every ID to its bucket name:
{"assignments": {"<id>": "<bucket>", ...}}
