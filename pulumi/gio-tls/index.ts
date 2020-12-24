import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as tls from "@pulumi/tls";
import * as fs from "fs";

/// ---
/// https://www.pulumi.com/docs/reference/pkg/aws/acm/certificate/#importing-an-existing-certificate
/// ---
///  Here I assume that
/// "examplePrivateKey" and "exampleSelfSignedCert" are
/// path to local files : they must be locally retrieved from secrethub
/// But no : this wouldcreate a new [TLS certificate/private key] Pair
/// ---
/**
const examplePrivateKey = new tls.PrivateKey("examplePrivateKey", {algorithm: "RSA"});
const exampleSelfSignedCert = new tls.SelfSignedCert("exampleSelfSignedCert", {
    keyAlgorithm: "RSA",
    privateKeyPem: examplePrivateKey.privateKeyPem,
    subjects: [{
        commonName: "example.com",
        organization: "ACME Examples, Inc",
    }],
    validityPeriodHours: 12,
    allowedUses: [
        "key_encipherment",
        "digital_signature",
        "server_auth",
    ],
});
const cert = new aws.acm.Certificate("cert", {
privateKey: examplePrivateKey.privateKeyPem,
certificateBody: exampleSelfSignedCert.certPem,
});
**/

/// ---
/// This one below is deduced from ccc
/// and properties of the [aws.acm.Certificate] are in
/// https://github.com/pulumi/pulumi-aws/blob/2401f87b1ead53af9b8d65fd48e3b99367fc2404/sdk/nodejs/acm/certificate.ts#L141
/// also inspired from https://www.pulumi.com/docs/reference/pkg/digitalocean/certificate/#custom-certificate
/// But too bad,this does not work : notpossible to do that.
/// Okay : let's just create an AWS certificate, sowe aresureAWS S3 http server does like it.
/// ---
/**
export const cert = new aws.acm.Certificate("cert", {
  privateKey: fs.readFileSync("/Users/terraform/certs/privkey.pem"),
  certificateBody: fs.readFileSync("/Users/terraform/certs/cert.pem"),
  certificateChain: fs.readFileSync("/Users/terraform/certs/fullchain.pem"),
});
**/


/// ---
/// The example below is created from an
/// example found at https://jandomanski.com/pulumi/aws/react/2020/10/29/deploy-create-react-app-aws-pulumi-post3.html
/// ---
const deployment_domain_name = "download.gravitee.io"
// Split a domain name into its subdomain and parent domain names.
// e.g. "www.example.com" => "www", "example.com".
function getDomainAndSubdomain(
  domain: string
): { subdomain: string; parentDomain: string } {
  const parts = domain.split(".");
  if (parts.length < 2) {
    throw new Error(`No TLD found on ${domain}`);
  }
  // No subdomain, e.g. awesome-website.com.
  if (parts.length === 2) {
    return { subdomain: "", parentDomain: domain };
  }

  const subdomain = parts[0];
  parts.shift(); // Drop first element.
  return {
    subdomain,
    // Trailing "." to canonicalize domain.
    parentDomain: parts.join(".") + ".",
  };
}

const domainParts = getDomainAndSubdomain(`${deployment_domain_name}`);
const hostedZoneId = aws.route53
  .getZone({ name: domainParts.parentDomain }, { async: true })
  .then((zone) => zone.zoneId);

const tenMinutes = 60 * 10;

// Per AWS, ACM certificate must be in the us-east-1 region.
const eastRegion = new aws.Provider("east", {
  profile: aws.config.profile,
  region: "us-east-1",
});

export const certificate = new aws.acm.Certificate(
  "certificate",
  {
    domainName: `${deployment_domain_name}`,
    validationMethod: "DNS",
  },
  { provider: eastRegion }
);

const certificateValidationDomain = new aws.route53.Record(
  "my-app.jandomanski.com-validation",
  {
    name: certificate.domainValidationOptions[0].resourceRecordName,
    zoneId: hostedZoneId,
    type: certificate.domainValidationOptions[0].resourceRecordType,
    records: [certificate.domainValidationOptions[0].resourceRecordValue],
    ttl: tenMinutes,
  }
);

const certificateValidation = new aws.acm.CertificateValidation(
  "certificateValidation",
  {
    certificateArn: certificate.arn,
    validationRecordFqdns: [certificateValidationDomain.fqdn],
  },
  { provider: eastRegion }
);
