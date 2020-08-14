---
layout: post
title: Managing Ansible playbook secrets with AWS services 
summary: A quick guide to secure secrets management with Ansible in AWS
date: 2020-08-06
img: posts/2020-08-06-ansible-secrets-aws-ssm-sm.png
tags: [ansible, aws, devops, security]
---

Lookup plugins for Ansible allow you to do a lot of cool things. One of them is to securely pass sensitive information to your playbooks. 
If you manage some apps in AWS with Ansible, then using Parameter Store or Secrets Manager along with it might greatly improve your security.\
Also, you can (or even should) use SSM Parameter Store to keep all your variables related to environment settings – this is what this service was made for and this is why it's called "**Parameter** Store"

## Variables with SSM Parameter Store

Let's say you have some variables defined in 'defaults/main.yaml' file of your role or maybe in group_vars.yaml file.
```yaml
---
# content of dev.vars.yaml to be included in your play or role
use_tls: true
application_port: 3000
app_env: development
stripe_api_key: 1HGASU2eZvKYlo2CT5MEcnC39HqLyjWD
```

If you store such things locally on Ansible control node, you probably encrypt it with [ansible-vault](https://docs.ansible.com/ansible/latest/user_guide/vault.html) 

SSM Parameter Store gives you more flexibility and security by centralized storage and management of parameters and secrets, so let's use it with Ansible:

```yaml
---
# content of dev.vars.yaml to be included in your play or role
use_tls: {% raw %}"{{lookup('aws_ssm', '/dev/webserver/use_tls')}}"{% endraw %}
application_port: {% raw %}"{{lookup('aws_ssm', '/dev/webserver/application_port')}}"{% endraw %}
app_env: {% raw %}"{{lookup('aws_ssm', '/dev/webserver/app_env')}}"{% endraw %}
stripe_api_key: {% raw %}"{{lookup('aws_ssm', '/dev/webserver/stripe_api_key')}}"{% endraw %}
```
The syntax is fairly simple:

The `aws_ssm` argument – is the name of plugin.

The `/dev/webserver/use_tls` argument – is the path to the key in Paramter Store.

Surely you can do the same for a group of servers with group variables, for example:

You can use this anywhere you can use templating: in a play, in variables file, or a Jinja2 template. 

## Variables with Secret Manager

Another cool lookup plugin is Secrets Manager. In a nutshell, it has the same kind of functionality but it uses JSON format by feault.

Here is a quick example of its functionality in a Playbook:

```yaml
---
- name: Extract something secrets from Secret Manager
  debug:
    msg: {% raw %}"{{ lookup('aws_secret', 'dev/some-secrets')}}"{% endraw %}
```
The above task will generate the following output
```
TASK [Extract something secrets from Secret Manager] ****************************************************
ok: [some_server] => {
    "msg": {
        "dbname": "database",
        "engine": "mysql",
        "host": "127.0.0.1",
        "password": "password",
        "port": "3306",
        "username": "db_user"
    }
}
```
This is nice if you want to insert a JSON as is, but you will need additional parsing in case you want to get only some of JSON elements.

## Conclusion

If you’re using Ansible in CI/CD, then having it on an EC2 Instance with the IAM role will make you avoid keeping any secrets on that instance at all.\
The IAM role must allow at least the read access to SSM Parameter Store (+ KMS read access to be able to decrypt the keys) or the read access to Secrets Manager. 

You can find documentation for described plugins here [aws_ssm](https://docs.ansible.com/ansible/latest/plugins/lookup/aws_ssm.html) and here [aws_secret](https://docs.ansible.com/ansible/latest/plugins/lookup/aws_secret.html).

More about lookup plugins: https://docs.ansible.com/ansible/latest/plugins/lookup.html