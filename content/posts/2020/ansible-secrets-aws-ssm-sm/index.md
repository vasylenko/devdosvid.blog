---
date: "2020-08-06T00:00:00Z"
title: Manage Ansible playbook secrets with AWS services
description: A quick guide to secure secrets management with Ansible in AWS
images: ["2020-08-06-ansible-secrets-aws-ssm-sm.png"]
cover:
    image: "2020-08-06-ansible-secrets-aws-ssm-sm.png"
description: A better way to store sensitive information for Ansible on EC2 or other services
tags: ["ansible", "aws", "devops", "security", "ssm"]
categories: [Amazon Web Services, Ansible]
alias: /2020/08/06/ansible-secrets-aws-ssm-sm.html
---
Lookup plugins for Ansible allow you to do a lot of cool things. One of them is to securely pass sensitive information to your playbooks. 

If you manage some apps in AWS with Ansible, then using Parameter Store or Secrets Manager along with it might greatly improve your security.

Described plugins are the part of `amazon.aws` collection in [Ansible Galaxy.](https://galaxy.ansible.com/amazon/aws)

Run the following command to install this collection:

```shell
ansible-galaxy collection install amazon.aws
```

## Variables with SSM Parameter Store

Let's say you have some variables defined in 'defaults/main.yaml' file of your role or maybe in group_vars.yaml file.
```yaml
# content of dev.vars.yaml to be included in your play or role

use_tls: true
application_port: 3000
app_env: development
stripe_api_key: 1HGASU2eZvKYlo2CT5MEcnC39HqLyjWD
```

If you store such things locally on Ansible control node, you probably encrypt it with [ansible-vault](https://docs.ansible.com/ansible/latest/user_guide/vault.html) 

SSM Parameter Store gives you more flexibility and security by centralized storage and management of parameters and secrets, so let's use it with Ansible:

```yaml
# content of dev.vars.yaml to be included in your play or role

use_tls: "{{ lookup('amazon.aws.aws_ssm', '/dev/webserver/use_tls', bypath=true) }}"
application_port: "{{ lookup('amazon.aws.aws_ssm', '/dev/webserver/application_port', bypath=true) }}"
app_env: "{{ lookup('amazon.aws.aws_ssm', '/dev/webserver/app_env', bypath=true) }}"
stripe_api_key: "{{ lookup('amazon.aws.aws_ssm', '/dev/webserver/stripe_api_key', bypath=true) }}"
```
The syntax is fairly simple:

The `aws_ssm` – is the name of the lookup plugin.

The `/dev/webserver/use_tls` – is the path to the key in the SSM Paramter Store.

You can use this anywhere you can use templating: in a play, in variables file, or a Jinja2 template. 

## Variables with Secret Manager

Another lookup plugin is Secrets Manager. Secrets Manager stores sensitive information in JSON format, supports rotation, encryption and other cool stuff. 

Here is a quick example of its functionality in a Playbook:

```yaml
- name: Extract something secrets from Secret Manager
  debug:
    msg: "{{ lookup('amazon.aws.aws_secret', 'DatabaseConnectionSettings')}}"
```
The above task will generate the following output
```shell
TASK [Extract something secrets from Secret Manager] ****************************************************
ok: [some_server] => {
    "msg": {
        "dbname": "database",
        "engine": "mysql",
        "host": "127.0.0.1",
        "password": "p@$$w0rd",
        "port": "3306",
        "username": "db_user"
    }
}
```
This is nice if you want to insert a JSON as is, but you will need additional parsing in case you want to get only some of JSON elements.

## Benefits from using lookup plugins
The biggest win here is the security — no sensitive information in the source code.

Another benefit is the convenience of data management: instead using built-in local vault, you can manage the secrets in centralized way. 

One of the common use cases for this kind of setup is CI/CD pipelines that generally run in stateless environments.

When using lookup plugins for Secrets Manager and Parameter Store, mind the access permissions. The assumed IAM role must allow at least the read access to SSM Parameter Store (+ KMS read access to be able to decrypt the keys) or the read access to Secrets Manager. 

You can find documentation for described plugins here [aws_ssm](https://docs.ansible.com/ansible/latest/plugins/lookup/aws_ssm.html) and here [aws_secret](https://docs.ansible.com/ansible/latest/plugins/lookup/aws_secret.html).

More about lookup plugins: https://docs.ansible.com/ansible/latest/plugins/lookup.html
