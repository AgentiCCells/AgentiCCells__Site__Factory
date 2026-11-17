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

## A second zone: promptugal.news (2026-11-17)
Dinis, 2026-11-17 ~18:20 UTC: "let's do this". promptugal.news is on Route 53 (awsdns nameservers, checked by cells@ 2026-11-17 through dns.google). If its hosted zone is in the **same AWS account** as agenticcells.site, extend the existing role; if it is in another account, ask cells@ or factory@ for a second role instead.

**Dinis's step:** replace the role's permission policy with this one. Replace `<AGENTICCELLS_ZONE_ID>` and `<PROMPTUGAL_ZONE_ID>` (Route 53, Hosted zones, the "Hosted zone ID" column). Still CNAME records only, subdomains only, one statement per zone:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CnamesUnderAgenticcellsSite",
      "Effect": "Allow",
      "Action": "route53:ChangeResourceRecordSets",
      "Resource": "arn:aws:route53:::hostedzone/<AGENTICCELLS_ZONE_ID>",
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
      "Sid": "CnamesUnderPromptugalNews",
      "Effect": "Allow",
      "Action": "route53:ChangeResourceRecordSets",
      "Resource": "arn:aws:route53:::hostedzone/<PROMPTUGAL_ZONE_ID>",
      "Condition": {
        "ForAllValues:StringEquals": {
          "route53:ChangeResourceRecordSetsRecordTypes": ["CNAME"],
          "route53:ChangeResourceRecordSetsActions": ["UPSERT", "DELETE"]
        },
        "ForAllValues:StringLike": {
          "route53:ChangeResourceRecordSetsNormalizedRecordNames": ["*.promptugal.news"]
        }
      }
    },
    {
      "Sid": "ReadTheTwoZones",
      "Effect": "Allow",
      "Action": "route53:ListResourceRecordSets",
      "Resource": [
        "arn:aws:route53:::hostedzone/<AGENTICCELLS_ZONE_ID>",
        "arn:aws:route53:::hostedzone/<PROMPTUGAL_ZONE_ID>"
      ]
    },
    {
      "Sid": "FindZonesByName",
      "Effect": "Allow",
      "Action": "route53:ListHostedZonesByName",
      "Resource": "*"
    }
  ]
}
```
`ListHostedZonesByName` lets the pipeline find a zone's ID from its name, so no new pipeline variable is needed; it reveals zone names and IDs in the account, nothing else, and AWS allows it only on `*`. If you would rather not grant it, leave out the last statement and instead add the environment variable `FACTORY_ROUTE53_ZONES` to the `apply` environment, for example `{"agenticcells.site":"<AGENTICCELLS_ZONE_ID>","promptugal.news":"<PROMPTUGAL_ZONE_ID>"}` (not a secret).

The apex `promptugal.news` and every other record type stay a person's job, as for agenticcells.site. To check it, run **Check AWS role setup**; to test the zone itself, the first PrompTugal request will show it in its status.
