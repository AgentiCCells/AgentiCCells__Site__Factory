# Setting up the AWS role for the DNS step (FAC-005b)

Status: proposal by factory@AgentiCCells.dinis, 2026-11-16, for Dinis to carry out. Nothing here exists yet.

The apply job adds one CNAME record per site (`<label>.agenticcells.site` to `agenticcells.github.io`) in the Route 53 zone for agenticcells.site. It assumes an AWS role through GitHub's OpenID Connect, so no AWS key is stored anywhere. The role can change CNAME records under agenticcells.site in that one zone, and nothing else.

## 1. The OIDC provider (once per AWS account)
In IAM, Identity providers, add an OpenID Connect provider:
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Skip this if the account already has it.

## 2. The role
Name: `agenticcells-site-factory-dns`. Maximum session: 1 hour.

**Trust policy** (only this repository's `apply` environment may assume it). Replace `<ACCOUNT_ID>`.

The subject carries the organisation's and the repository's numeric IDs (`AgentiCCells@357027852`, `AgentiCCells__Site__Factory@1459223341`): that is the subject format GitHub sends for this organisation, read from the **Check AWS role setup** run of 2026-11-16 02:28 UTC. It also means a repository deleted and recreated under the same name does not match.
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:AgentiCCells@357027852/AgentiCCells__Site__Factory@1459223341:environment:apply"
      }
    }
  }]
}
```

**Permission policy** (one zone, CNAME records only, subdomains only, create or change or delete). Replace `<ZONE_ID>`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "route53:ChangeResourceRecordSets",
      "Resource": "arn:aws:route53:::hostedzone/<ZONE_ID>",
      "Condition": {
        "ForAllValues:StringEquals": {
          "route53:ChangeResourceRecordSetsRecordTypes": ["CNAME"],
          "route53:ChangeResourceRecordSetsActions": ["UPSERT", "DELETE"]
        },
        "ForAllValues:StringLike": {
          "route53:ChangeResourceRecordSetsNormalizedRecordNames": ["*.agenticcells.site"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": "route53:ListResourceRecordSets",
      "Resource": "arn:aws:route53:::hostedzone/<ZONE_ID>"
    }
  ]
}
```
DELETE is for teardown (FAC-006). The apex record and every other record type stay a person's job.

## 3. Tell the pipeline (not secret)
In AgentiCCells__Site__Factory, environment `apply`, add **environment variables**:
- `FACTORY_AWS_ROLE_ARN`: the role's ARN
- `FACTORY_ROUTE53_ZONE_ID`: the zone ID for agenticcells.site

Neither is a secret. Then tell factory@ "the AWS role is set up".

## Revoking
Delete the role, or remove the trust policy's statement. Nothing else holds the access.
