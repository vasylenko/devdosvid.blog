---
layout: post
title: Managing Ansible playbook secrets with AWS services 
summary: A quick guide to secure secrets management with Ansible in AWS
date: 2020-08-06
img: posts/2020-08-06-ansible-secrets-aws-ssm-sm.png
tags: [ansible, aws, devops, security]
---

## Intro
Lookup plugins for Ansible allow you to do a lot of cool things. One of them is to securely pass sensitive information to your playbooks. 
If you manage some apps in AWS with Ansible, then using Parameter Store or Secrets Manager along with it might greatly improve your security. 

## Inventory with SSM Parameter Store

Suppose we have the following inventory.\
*All examples hereafter are simplified for the sake of easy-reading, but they still give the main idea*.

``` yaml
# host_inventory.yaml
all: 
  hosts:
      some_server:
        ansible_host: 54.80.167.162      
```
The Internet generally advises using ansible-vault or ssh-agent to keep and use ssh keys needed for connection.\
Here is an alternative: **keep your SSH key in Parameter Store and make Ansible get it for you.**

``` yaml
# host_inventory.yaml
all: 
  hosts:
      some_server:
        ansible_host: 54.80.167.162
        ansible_ssh_private_key_file: {% raw %}"{{lookup('aws_ssm','/dev/some-server/ssh-key')}}"{% endraw %}
```

The syntax is fairly simple:

The `aws_ssm` argument – is the name of plugin.

The `/dev/some-server/ssh-key` argument here is a path to the key in Paramter Store.

Surely you can do the same for a group of servers with group variables, for example:

```yaml
# host_inventory_with_group_vars.yaml
some_group:
  hosts:
    some_server:
      ansible_host: 54.80.167.162
    some_other_server:
      ansible_host: 45.08.176.126
  vars:
    ansible_ssh_private_key_file: {% raw %}"{{lookup('aws_ssm', '/dev/servers-group/ssh-key')}}"{% endraw %}
```

## Playbooks with Secret Manager

Another cool lookup plugin is Secrets Manager. In a nutshell, it has the same kind of functionality but fits better for applications (in my humble opinion, of course). Also, keep in mind that it returns JSON object (because you store objects as JSON in SM)

Here is a quick example of its functionality in a Playbook:

```yaml
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

May it be used vice versa: Parameter Store in playbooks and SM for inventory – of course!\
May I use only of them – sure!

If you’re using Ansible in CI/CD, then having it on an EC2 Instance with the IAM role will make you avoid keeping any secrets on that instance at all.\
The IAM role must allow at least read access to SSM Parameter Store (+ KMS read access to be able to decrypt the keys) or read access to Secrets Manager. 

You can find documentation for described plugins here [aws_ssm](https://docs.ansible.com/ansible/latest/plugins/lookup/aws_ssm.html) and here [aws_secret](https://docs.ansible.com/ansible/latest/plugins/lookup/aws_secret.html).